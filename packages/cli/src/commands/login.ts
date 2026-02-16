/*
 * Login flow state machine:
 *
 * PROMPT_TOKEN ──→ DETECT PREFIX
 *                       │
 *            ┌──────────┴──────────┐
 *            ▼                     ▼
 *      ghp_ / github_pat_    psk_agent_
 *            │                     │
 *            ▼                     ▼
 *   GET github.com/user    GET /api/agents/me
 *            │                     │
 *       ┌────┴────┐          ┌─────┴─────┐
 *       ▼         ▼          ▼           ▼
 *     200 OK   401/ERR     200 OK     401/ERR
 *       │         │          │           │
 *       ▼         ▼          ▼           ▼
 *  setToken()  EXIT(1)   setToken()   EXIT(1)
 *  "Logged in            "agent name (status)"
 *   as alice"            + claim URL if unclaimed
 */

import { Command } from "commander";
import chalk from "chalk";
import { password } from "@inquirer/prompts";
import { setToken } from "../auth.js";
import { REGISTRY_URL } from "../config.js";

export const loginCommand = new Command("login")
  .description("Authenticate with a GitHub PAT or agent API key")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .action(async (options: { registry: string }) => {
    console.log(chalk.bold("\nPolySkill Login"));
    console.log(
      chalk.dim("Use a GitHub PAT (ghp_/github_pat_) or agent API key (psk_agent_)\n")
    );

    const token = await password({
      message: "Token:",
      validate: (value) => {
        if (
          !value.startsWith("ghp_") &&
          !value.startsWith("github_pat_") &&
          !value.startsWith("psk_agent_")
        ) {
          return "Token must start with ghp_, github_pat_, or psk_agent_";
        }
        return true;
      },
    });

    if (token.startsWith("psk_agent_")) {
      // Agent API key — validate against registry
      let response: Response;
      try {
        response = await fetch(`${options.registry}/api/agents/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "PolySkill-CLI",
          },
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        console.log(chalk.red("\nFailed to connect to registry\n"));
        process.exit(1);
      }

      if (!response.ok) {
        console.log(chalk.red("\nInvalid or expired agent API key\n"));
        process.exit(1);
      }

      const agent = (await response.json()) as { name: string; id: string; claimed: boolean };
      setToken(token);

      const status = agent.claimed ? "Claimed" : "Unclaimed";
      console.log(chalk.green(`\nLogged in as agent ${agent.name} (${status})`));
      console.log(
        `You can publish skills under ${chalk.cyan(`@${agent.name}/`)}`
      );
      if (!agent.claimed) {
        console.log(
          `Claim your agent: ${chalk.cyan(`https://polyskill.ai/claim?id=${agent.id}`)}`
        );
      }
      console.log();
    } else {
      // GitHub PAT — validate against GitHub API
      let response: Response;
      try {
        response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "PolySkill-CLI",
          },
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        console.log(chalk.red("\nFailed to connect to GitHub API\n"));
        process.exit(1);
      }

      if (!response.ok) {
        console.log(chalk.red("\nInvalid or expired GitHub token\n"));
        process.exit(1);
      }

      const user = (await response.json()) as { login: string };
      setToken(token);

      console.log(chalk.green(`\nLogged in as ${user.login}.`));
      console.log(
        `You can publish skills under ${chalk.cyan(`@${user.login}/`)}\n`
      );
    }
  });
