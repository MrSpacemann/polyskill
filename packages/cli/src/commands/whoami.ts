/*
 * polyskill whoami — who the saved login is (the source of truth):
 *   nothing saved ─▶ EXIT 1 (run polyskill login)
 *   psk_agent_ key ─▶ GET /api/agents/me
 *     ├─ 200 ─▶ agent name, owner when claimed, namespaces; unclaimed: how to get a claim link
 *     ├─ 401 ─▶ EXIT 1 (invalid or revoked)
 *     └─ other / network ─▶ EXIT 1
 *   GitHub token ─▶ GET api.github.com/user
 *     ├─ 200 ─▶ login and namespace
 *     └─ else ─▶ EXIT 1
 * --json prints the same facts as JSON (never the token).
 */
import { Command } from "commander";
import chalk from "chalk";
import { getToken } from "../auth.js";
import { REGISTRY_URL } from "../config.js";

export const whoamiCommand = new Command("whoami")
  .description("Show who you are signed in as, and where you can publish")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("--json", "Print the result as JSON")
  .action(async (options: { registry: string; json?: boolean }) => {
    const token = getToken();
    if (!token) {
      console.log(chalk.red("\nNot signed in. Run: polyskill login\n"));
      process.exit(1);
    }

    if (token.startsWith("psk_agent_")) {
      let res: Response;
      try {
        res = await fetch(`${options.registry}/api/agents/me`, {
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "PolySkill-CLI" },
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        console.log(chalk.red("\nFailed to connect to registry\n"));
        process.exit(1);
      }
      if (res.status === 401) {
        console.log(chalk.red("\nThe saved agent key is invalid or was revoked. Run: polyskill login\n"));
        process.exit(1);
      }
      if (!res.ok) {
        console.log(chalk.red(`\nCould not check the saved key (HTTP ${res.status})\n`));
        process.exit(1);
      }
      const me = await res.json() as {
        name: string; claimed: boolean; owner_login?: string | null; namespaces?: string[]; claimable?: boolean;
      };
      const namespaces = me.namespaces?.length ? me.namespaces : [`@${me.name}/`];
      if (options.json) {
        console.log(JSON.stringify({
          kind: "agent",
          agent: me.name,
          claimed: me.claimed,
          owner: me.owner_login ?? null,
          namespaces,
        }, null, 2));
        return;
      }
      if (me.claimed) {
        console.log(`\nSigned in as ${chalk.bold(`@${me.owner_login}`)} (this computer's key: agent ${me.name})`);
      } else {
        console.log(`\nSigned in as agent ${chalk.bold(me.name)} (not claimed yet)`);
      }
      console.log(`You can publish under ${namespaces.map((n) => chalk.cyan(n)).join(" and ")}`);
      if (!me.claimed) {
        console.log(`To publish under your human's name, send them a claim link: ${chalk.cyan("polyskill agent claim-link")}`);
      }
      console.log();
      return;
    }

    let res: Response;
    try {
      res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "PolySkill-CLI",
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.log(chalk.red("\nFailed to connect to GitHub\n"));
      process.exit(1);
    }
    if (!res.ok) {
      console.log(chalk.red("\nThe saved GitHub token is invalid or expired. Run: polyskill login\n"));
      process.exit(1);
    }
    const user = await res.json() as { login: string };
    if (options.json) {
      console.log(JSON.stringify({ kind: "github", login: user.login, namespaces: [`@${user.login.toLowerCase()}/`] }, null, 2));
      return;
    }
    console.log(`\nSigned in as ${chalk.bold(`@${user.login}`)} (GitHub token)`);
    console.log(`You can publish under ${chalk.cyan(`@${user.login.toLowerCase()}/`)}\n`);
  });
