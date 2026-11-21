/*
 * polyskill login — browser sign-in (default). The source of truth; code that
 * disagrees is wrong:
 *
 *   REGISTER  POST /api/agents/register, name cli-<computer>-<4 hex>
 *     ├─ 409 (name taken) ─▶ new suffix, retry, at most MAX_NAME_TRIES ─▶ EXIT 1
 *     ├─ 429 ─▶ EXIT 1 (too many sign-ins from this network; --token still works)
 *     ├─ other / network ─▶ EXIT 1
 *     └─ 201 ─▶ the key is held in memory only: the saved login is untouched
 *   SHOW LINK print the claim link; open the browser (not with --no-browser or
 *             when stdout isn't a terminal)
 *   WAIT      every POLL_MS GET /api/agents/me with the new key
 *     ├─ claimed ─────────────▶ setToken(key) ─▶ "Signed in as @<owner>" (DONE)
 *     ├─ not claimable ───────▶ EXIT 1 (the server says the link expired: run polyskill login again)
 *     ├─ LOGIN_WAIT_MS of local time passed ─▶ one last poll, then EXIT 1 (same)
 *     │    (local time only: the server's expiry vs a wrong laptop clock proves nothing)
 *     ├─ 429 ─────────────────▶ wait Retry-After (or RATE_WAIT_MS, never past the deadline), keep waiting
 *     ├─ 401 ─────────────────▶ EXIT 1 (the key was revoked)
 *     └─ network / 5xx ───────▶ keep waiting; MAX_POLL_FAILURES in a row ─▶ EXIT 1
 *   Ctrl-C anywhere: nothing is saved.
 *
 * polyskill login --token — paste a GitHub token or an agent key:
 *   PROMPT ─▶ ghp_/github_pat_: GET github.com/user ─▶ 200 setToken / else EXIT 1
 *          ─▶ psk_agent_: GET /api/agents/me ─▶ 200 setToken / else EXIT 1
 */

import { Command } from "commander";
import chalk from "chalk";
import { password } from "@inquirer/prompts";
import { setToken } from "../auth.js";
import { REGISTRY_URL } from "../config.js";
import { generateAgentName } from "../agentName.js";
import { openInBrowser } from "../browser.js";
import { sleep } from "../sleep.js";
import { claimLinkFor } from "../claimLink.js";

export const POLL_MS = 5_000;
export const RATE_WAIT_MS = 30_000;
export const MAX_POLL_FAILURES = 12;
export const MAX_NAME_TRIES = 3;
/** The server's claim window is 60 min; wait a little past it before giving up. */
export const LOGIN_WAIT_MS = 61 * 60_000;

interface Registered { id: string; name: string; api_key: string; claim_url: string; claim_expires_at?: string | null }

async function registerForLogin(registry: string): Promise<Registered> {
  for (let attempt = 1; attempt <= MAX_NAME_TRIES; attempt++) {
    const name = generateAgentName("cli");
    let res: Response;
    try {
      res = await fetch(`${registry}/api/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "PolySkill-CLI" },
        body: JSON.stringify({ name, description: "polyskill CLI sign-in" }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.log(chalk.red("\nFailed to connect to registry\n"));
      process.exit(1);
    }
    if (res.status === 201) return (await res.json()) as Registered;
    if (res.status === 409) continue;
    if (res.status === 429) {
      console.log(chalk.red("\nToo many sign-ins from this network. Wait 15 minutes, or use: polyskill login --token\n"));
      process.exit(1);
    }
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    console.log(chalk.red(`\nSign-in failed: ${body.message || res.statusText}\n`));
    process.exit(1);
  }
  console.log(chalk.red("\nCould not pick a free name for this computer. Try again.\n"));
  process.exit(1);
}

/** Waits until the claim lands. Returns the owner's login; exits on every dead end. */
async function waitForClaim(registry: string, reg: Registered): Promise<string> {
  const deadline = Date.now() + LOGIN_WAIT_MS;
  const left = () => Math.max(0, deadline - Date.now());
  let failures = 0;
  for (let last = false; !last; ) {
    last = left() <= POLL_MS; // this poll is the last one
    await sleep(Math.min(POLL_MS, left()));
    let res: Response;
    try {
      res = await fetch(`${registry}/api/agents/me`, {
        headers: { Authorization: `Bearer ${reg.api_key}`, "User-Agent": "PolySkill-CLI" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      if (++failures >= MAX_POLL_FAILURES) {
        console.log(chalk.red("\nLost the connection to the registry while waiting. Run: polyskill login\n"));
        process.exit(1);
      }
      continue;
    }
    if (res.status === 429) {
      const after = Number(res.headers?.get?.("retry-after"));
      await sleep(Math.min(Number.isFinite(after) && after > 0 ? after * 1000 : RATE_WAIT_MS, left()));
      continue;
    }
    if (res.status === 401) {
      console.log(chalk.red("\nThis sign-in was revoked before it finished. Run: polyskill login\n"));
      process.exit(1);
    }
    if (!res.ok) {
      if (++failures >= MAX_POLL_FAILURES) {
        console.log(chalk.red(`\nThe registry kept failing (HTTP ${res.status}) while waiting. Run: polyskill login\n`));
        process.exit(1);
      }
      continue;
    }
    failures = 0;
    const me = (await res.json()) as { claimed: boolean; claimable?: boolean; owner_login?: string | null };
    if (me.claimed) return me.owner_login || "";
    if (me.claimable === false) break;
  }
  console.log(chalk.red("\nThe sign-in link expired. Run: polyskill login\n"));
  process.exit(1);
}

async function loginWithBrowser(registry: string, openBrowser: boolean): Promise<void> {
  console.log(chalk.bold("\nPolySkill Login\n"));
  const reg = await registerForLogin(registry);
  const link = claimLinkFor(registry, reg.claim_url);
  console.log("Open this link, sign in with GitHub and click Claim:\n");
  console.log(`  ${chalk.cyan(link)}\n`);
  if (openBrowser && process.stdout.isTTY) openInBrowser(link);
  console.log(chalk.dim("Waiting for you to claim it (Ctrl-C to cancel; nothing is saved until then)..."));

  const owner = await waitForClaim(registry, reg);
  setToken(reg.api_key);
  console.log(chalk.green(`\nSigned in as @${owner}.`));
  console.log(`You can publish skills under ${chalk.cyan(`@${owner.toLowerCase()}/`)}.`);
  console.log(chalk.dim(`This computer's key is agent ${reg.name}: revoke it any time under My Skills on polyskill.ai.\n`));
}

export const loginCommand = new Command("login")
  .description("Sign in: opens polyskill.ai in your browser (or --token to paste a token)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("--token", "Paste a GitHub token (ghp_/github_pat_) or agent key (psk_agent_) instead")
  .option("--no-browser", "Print the sign-in link without opening a browser")
  .action(async (options: { registry: string; token?: boolean; browser: boolean }) => {
    if (!options.token) {
      await loginWithBrowser(options.registry, options.browser);
      return;
    }
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

      const agent = (await response.json()) as {
        name: string; id: string; claimed: boolean; owner_login?: string | null; namespaces?: string[];
      };
      setToken(token);

      const status = agent.claimed ? `Claimed by @${agent.owner_login ?? "?"}` : "Unclaimed";
      console.log(chalk.green(`\nLogged in as agent ${agent.name} (${status})`));
      const namespaces = agent.namespaces?.length ? agent.namespaces : [`@${agent.name}/`];
      console.log(`You can publish skills under ${namespaces.map((n) => chalk.cyan(n)).join(" and ")}`);
      if (!agent.claimed) {
        console.log(`Get a claim link for your human: ${chalk.cyan("polyskill agent claim-link")}`);
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
