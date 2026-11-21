/*
 * polyskill agent register — an agent identity (the source of truth):
 *
 *   NAME  --name, else a prompt when stdin is a terminal, else generated
 *         (agent-<computer>-<4 hex>); DESCRIPTION  --description, else a prompt
 *         on a terminal, else none
 *   POST /api/agents/register
 *     ├─ 201 ─▶ setToken(api_key); print the namespace and the claim link
 *     │         (--json: id, name, claim_url, claim_expires_at, namespaces;
 *     │          never the key)
 *     ├─ 409 ─▶ EXIT 1 with the registry's reason (taken, or a publisher's login)
 *     ├─ 429 ─▶ EXIT 1 (5 registrations per 15 min per network)
 *     └─ other / network ─▶ EXIT 1
 *
 * polyskill agent claim-link — a fresh claim link for the saved agent key:
 *   no agent key saved ─▶ EXIT 1
 *   POST /api/agents/me/claim-link
 *     ├─ 200 ─▶ print the link (every earlier link stops working)
 *     ├─ 409 ─▶ already claimed: say so, exit 0
 *     ├─ 401 ─▶ EXIT 1 (key invalid or revoked)
 *     └─ other / network ─▶ EXIT 1
 */

import { Command } from "commander";
import chalk from "chalk";
import { input } from "@inquirer/prompts";
import { setToken, getToken } from "../auth.js";
import { REGISTRY_URL } from "../config.js";
import { AGENT_NAME_RE, generateAgentName } from "../agentName.js";

export const agentCommand = new Command("agent")
  .description("Manage agent identities");

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

agentCommand
  .command("register")
  .description("Register a new agent and get an API key (saved locally, never printed)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("--name <name>", "Agent name (2-39 lowercase letters, digits, hyphens)")
  .option("--description <text>", "What this agent is (optional, max 256 chars)")
  .option("--json", "Print the result as JSON (without the key)")
  .action(async (options: { registry: string; name?: string; description?: string; json?: boolean }) => {
    const interactive = !!process.stdin.isTTY && !options.json;
    if (!options.json) console.log(chalk.bold("\nAgent Registration\n"));

    let name = options.name;
    if (name === undefined) {
      name = interactive
        ? await input({
            message: "Agent name (lowercase, 2-39 chars):",
            validate: (value) =>
              AGENT_NAME_RE.test(value) ||
              "Must be 2-39 lowercase alphanumeric characters or hyphens, no consecutive hyphens",
          })
        : generateAgentName("agent");
    }
    if (!AGENT_NAME_RE.test(name)) {
      console.log(chalk.red("\nAgent name must be 2-39 lowercase alphanumeric characters or hyphens, no consecutive hyphens\n"));
      process.exit(1);
    }

    let description = options.description;
    if (description === undefined && interactive && options.name === undefined) {
      description = await input({ message: "Description (optional):" });
    }

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
          description: description?.trim() || undefined,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.log(chalk.red("\nFailed to connect to registry\n"));
      process.exit(1);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      if (res.status === 409) {
        console.log(chalk.red(`\n${body.message || `Agent name "${name}" is already registered`}\n`));
      } else if (res.status === 429) {
        console.log(chalk.red("\nToo many registrations from this network (5 per 15 minutes). Try again later.\n"));
      } else {
        console.log(chalk.red(`\nRegistration failed: ${body.message || res.statusText}\n`));
      }
      process.exit(1);
    }

    const reg = await res.json() as {
      id: string; name: string; api_key: string; claim_url: string; claim_expires_at?: string | null;
    };
    setToken(reg.api_key);

    if (options.json) {
      printJson({
        id: reg.id,
        name: reg.name,
        claim_url: reg.claim_url,
        claim_expires_at: reg.claim_expires_at ?? null,
        namespaces: [`@${reg.name}/`],
      });
      return;
    }
    console.log(chalk.green(`\nAgent "${reg.name}" registered successfully!`));
    console.log(`\nAPI key saved. You can now publish skills under ${chalk.cyan(`@${reg.name}/`)}`);
    console.log(`\nSend this link to your human: they sign in with GitHub and click Claim. Then you can`);
    console.log(`also publish under their name. It works for one hour (new one: polyskill agent claim-link).`);
    console.log(`\n  ${chalk.cyan(reg.claim_url)}`);
    console.log(
      chalk.yellow("\nSecurity warning: your API key is stored in ~/.polyskill/token")
    );
    console.log(
      chalk.yellow("Keep it safe — anyone with this key can publish skills as your agent.\n")
    );
  });

agentCommand
  .command("claim-link")
  .description("Get a fresh claim link for this agent (earlier links stop working)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("--json", "Print the result as JSON")
  .action(async (options: { registry: string; json?: boolean }) => {
    const token = getToken();
    if (!token?.startsWith("psk_agent_")) {
      console.log(chalk.red("\nNo agent key saved. Run: polyskill agent register\n"));
      process.exit(1);
    }

    let res: Response;
    try {
      res = await fetch(`${options.registry}/api/agents/me/claim-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "PolySkill-CLI" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.log(chalk.red("\nFailed to connect to registry\n"));
      process.exit(1);
    }

    if (res.status === 409) {
      if (options.json) printJson({ claimed: true, claim_url: null });
      else console.log(chalk.green("\nThis agent is already claimed. Run polyskill whoami to see by whom.\n"));
      return;
    }
    if (res.status === 401) {
      console.log(chalk.red("\nThe saved agent key is invalid or was revoked. Run: polyskill agent register\n"));
      process.exit(1);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      console.log(chalk.red(`\nCould not get a claim link: ${body.message || res.statusText}\n`));
      process.exit(1);
    }

    const link = await res.json() as { claim_url: string; claim_expires_at?: string | null };
    if (options.json) {
      printJson({ claimed: false, claim_url: link.claim_url, claim_expires_at: link.claim_expires_at ?? null });
      return;
    }
    console.log(`\nSend this link to your human (it works for one hour; earlier links no longer work):`);
    console.log(`\n  ${chalk.cyan(link.claim_url)}\n`);
  });
