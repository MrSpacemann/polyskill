/*
 * Install flow state machine:
 *
 * FETCH_REGISTRY ──→ RESOLVE_TARGET ──→ WRITE_FILES ──→ SUCCESS
 *        │                  │                 │
 *        ├──→ NOT_FOUND      ├──→ UNKNOWN_TARGET └──→ WRITE_ERR (EACCES, ENOSPC, etc.)
 *        ├──→ HTTP_ERR       └──→ AMBIGUOUS_TARGET
 *        │
 *        ▼
 *   NETWORK_ERR (DNS / timeout / refused)
 */

import { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { REGISTRY_URL } from "../config.js";
import { resolveTarget } from "../targets/index.js";

export const installCommand = new Command("install")
  .description("Install a Skill from the PolySkill registry")
  .argument("<name>", "Skill name (e.g. @author/skill-name)")
  .argument("[version]", "Specific version (defaults to latest)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("-o, --output <dir>", "Output directory (local target only)")
  .option(
    "--target <runtime>",
    "Install target: claude-code | codex | openclaw | opencode | local"
  )
  .action(
    async (
      name: string,
      version: string | undefined,
      options: { registry: string; output?: string; target?: string }
    ) => {
      const registryUrl = options.registry;

      console.log(chalk.bold(`\nInstalling ${name}${version ? `@${version}` : ""}...`));

      // Fetch from registry
      const encodedName = encodeURIComponent(name);
      const url = version
        ? `${registryUrl}/api/skills/${encodedName}/${encodeURIComponent(version)}`
        : `${registryUrl}/api/skills/${encodedName}`;

      let res: Response;
      try {
        res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      } catch (err: any) {
        const msg =
          err.name === "TimeoutError"
            ? "Request timed out — is the registry running?"
            : `Network error: ${err.message}`;
        console.log(chalk.red(`\n${msg}\n`));
        process.exit(1);
      }

      if (!res.ok) {
        if (res.status === 404) {
          console.log(chalk.red(`\nSkill not found: ${name}`));
        } else {
          console.log(chalk.red(`\nFailed to fetch skill: ${res.statusText}`));
        }
        process.exit(1);
      }

      const skill = (await res.json()) as any;

      // Resolve target (--target flag, --output implies local, or auto-detect)
      const target = resolveTarget(options.target, options.output !== undefined);
      const outputDir = resolve(process.cwd(), options.output ?? ".");

      if (options.output !== undefined && target.name !== "local") {
        console.log(
          chalk.yellow(
            `  Warning: --output is ignored for the "${target.name}" target (files go to ${target.dir})`
          )
        );
      }

      // Write skill files via target
      try {
        await target.write(skill, outputDir);
      } catch (err: any) {
        console.log(chalk.red(`\nFailed to write skill files: ${err.message}\n`));
        process.exit(1);
      }

      // Track download only after successful write
      try {
        await fetch(`${registryUrl}/api/skills/${encodedName}/download`, {
          method: "POST",
          signal: AbortSignal.timeout(5_000),
        });
      } catch (_) {
        // Non-critical — don't block the install
      }

      const badge = skill.verified
        ? chalk.green("[verified]")
        : chalk.yellow("[unverified]");

      console.log(
        chalk.green(`\nInstalled ${skill.name}@${skill.version}`) + ` ${badge}`
      );
      if (!skill.verified) {
        console.log(chalk.yellow("  Warning: This skill has not been verified"));
      }
      console.log();
    }
  );
