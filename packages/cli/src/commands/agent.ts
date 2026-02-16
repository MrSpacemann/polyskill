/*
 * Agent register flow state machine:
 *
 * PROMPT_NAME ──→ PROMPT_DESC ──→ POST /api/agents/register
 *                                        │
 *                            ┌───────────┼───────────┐
 *                            ▼           ▼           ▼
 *                         201 OK     409 TAKEN    400/5xx/NETWORK
 *                            │           │           │
 *                            ▼           ▼           ▼
 *                      setToken()     EXIT(1)     EXIT(1)
 *                      Print claim URL
 *                      Print security warning
 */

import { Command } from "commander";
import chalk from "chalk";
import { input } from "@inquirer/prompts";
import { setToken } from "../auth.js";
import { REGISTRY_URL } from "../config.js";

const AGENT_NAME_RE = /^(?!.*--)[a-z0-9][a-z0-9-]{0,37}[a-z0-9]$/;

export const agentCommand = new Command("agent")
  .description("Manage agent identities");

agentCommand
  .command("register")
  .description("Register a new agent and get an API key")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .action(async (options: { registry: string }) => {
    console.log(chalk.bold("\nAgent Registration\n"));

    const name = await input({
      message: "Agent name (lowercase, 2-39 chars):",
      validate: (value) => {
        if (!AGENT_NAME_RE.test(value)) {
          return "Must be 2-39 lowercase alphanumeric characters or hyphens, no consecutive hyphens";
        }
        return true;
      },
    });

    const description = await input({
      message: "Description (optional):",
    });

    let res: Response;
    try {
      res = await fetch(`${options.registry}/api/agents/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "PolySkill-CLI",
        },
        body: JSON.stringify({
          name,
          description: description.trim() || undefined,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.log(chalk.red("\nFailed to connect to registry\n"));
      process.exit(1);
    }

    if (res.status === 409) {
      console.log(chalk.red(`\nAgent name "${name}" is already registered\n`));
      process.exit(1);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      console.log(chalk.red(`\nRegistration failed: ${body.message || res.statusText}\n`));
      process.exit(1);
    }

    const { api_key, claim_url } = await res.json() as { api_key: string; claim_url: string };
    setToken(api_key);

    console.log(chalk.green(`\nAgent "${name}" registered successfully!`));
    console.log(`\nAPI key saved. You can now publish skills under ${chalk.cyan(`@${name}/`)}`);
    console.log(`\nClaim your agent: ${chalk.cyan(claim_url)}`);
    console.log(
      chalk.yellow("\nSecurity warning: your API key is stored in ~/.polyskill/token")
    );
    console.log(
      chalk.yellow("Keep it safe — anyone with this key can publish skills as your agent.\n")
    );
  });
