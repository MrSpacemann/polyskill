/*
 * Publish flow state machine:
 *
 * CHECK_AUTH ──→ LOAD_SKILL ──→ BUILD_ADAPTERS ──→ POST_REGISTRY ──→ SUCCESS
 *     │              │                                    │
 *     ▼              ▼                                    ├──→ 401 (bad token)
 *  NO_TOKEN       LOAD_ERR                               ├──→ 403 (namespace/ownership)
 *                                                        ├──→ HTTP_ERR (409 / 400 / 5xx)
 *                                                        ▼
 *                                                   NETWORK_ERR
 */

import { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { loadSkill, getAdapter } from "@polyskill/core";
import { REGISTRY_URL } from "../config.js";
import { getToken } from "../auth.js";

interface ErrorResponse {
  error?: string;
  message?: string;
  details?: string[];
}

export const publishCommand = new Command("publish")
  .description("Publish a Skill to the PolySkill registry")
  .argument("[directory]", "Skill directory to publish", ".")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .action(async (directory: string, options: { registry: string }) => {
    const skillDir = resolve(process.cwd(), directory);
    const registryUrl = options.registry;

    // Check authentication
    const token = getToken();
    if (!token) {
      console.log(chalk.red("\nNot authenticated. Run: polyskill login"));
      console.log(chalk.dim("Or register an agent: polyskill agent register\n"));
      process.exit(1);
    }

    console.log(chalk.bold("\nPublishing skill..."));

    // Load and validate skill
    let skill;
    try {
      skill = await loadSkill(skillDir);
    } catch (err: any) {
      console.log(chalk.red(`\n${err.message}\n`));
      process.exit(1);
    }

    // Build adapter outputs
    const adapters: Record<string, unknown> = {};
    for (const platform of skill.manifest.adapters) {
      const adapter = getAdapter(platform);
      if (adapter) {
        adapters[platform] = adapter.transpile(skill);
      }
    }

    // Publish to registry
    const body = {
      manifest: skill.manifest,
      tools: skill.tools.length > 0 ? { tools: skill.tools } : null,
      instructions: skill.instructions,
      adapters,
    };

    let res: Response;
    try {
      res = await fetch(`${registryUrl}/api/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err: any) {
      const msg = err.name === "TimeoutError"
        ? "Request timed out — is the registry running?"
        : `Network error: ${err.message}`;
      console.log(chalk.red(`\n${msg}\n`));
      process.exit(1);
    }

    if (!res.ok) {
      const error: ErrorResponse = await res.json().catch(() => ({ message: res.statusText }));
      if (res.status === 401) {
        console.log(chalk.red("\nAuthentication failed. Run: polyskill login"));
        console.log(chalk.dim("Or register an agent: polyskill agent register\n"));
      } else if (res.status === 403) {
        console.log(chalk.red(`\nPublish failed: ${error.message}`));
        console.log(chalk.dim("Skill names must match your GitHub username or agent name: @<name>/skill-name\n"));
      } else {
        console.log(
          chalk.red(`\nPublish failed: ${error.error || error.message}`)
        );
        if (error.details) {
          for (const detail of error.details) {
            console.log(chalk.red(`  - ${detail}`));
          }
        }
      }
      process.exit(1);
    }

    const result = await res.json() as { id: string };
    console.log(
      chalk.green(
        `\nPublished ${skill.manifest.name}@${skill.manifest.version}`
      )
    );
    console.log(chalk.dim(`  ID: ${result.id}`));
    console.log(
      chalk.dim(`  Registry: ${registryUrl}`)
    );
    console.log(
      `\nInstall with: ${chalk.cyan(`polyskill install ${skill.manifest.name}`)}\n`
    );
  });
