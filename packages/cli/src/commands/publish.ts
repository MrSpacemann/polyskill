/*
 * Publish flow state machine (the source of truth):
 *
 * CHECK_AUTH ──→ LOAD_SKILL ──→ VERSION_CHECK ──→ BUILD_ADAPTERS ──→ POST_REGISTRY ──→ SUCCESS
 *     │              │              │                                   │
 *     ▼              ▼              │ GET the live skill (no --no-bump):├──→ 401 (bad token)
 *  NO_TOKEN       LOAD_ERR          │ live == local (plain x.y.z):      ├──→ 403 (namespace/ownership)
 *                                   │   same content ─▶ ALREADY_LIVE    ├──→ HTTP_ERR (409 / 400 / 5xx)
 *                                   │   (nothing published, exit 0)     ▼
 *                                   │   changed ─▶ publish live+1 patch NETWORK_ERR
 *                                   │ live > local ─▶ EXIT 1 (behind: someone published newer work)
 *                                   │ anything else (404 new skill, local newer, error, prerelease)
 *                                   │   ──▶ publish the local version as is
 *  SUCCESS after a bump ──▶ write the new version into skill.json (only then: a failed
 *  publish leaves the file alone; a skill.json without exactly one "version" field is
 *  left alone with a note to bump it by hand next time).
 */

import { Command } from "commander";
import { resolve, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import { loadSkill, getAdapter } from "@polyskill/core";
import { REGISTRY_URL } from "../config.js";
import { getToken } from "../auth.js";

const PLAIN_SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/** -1 / 0 / 1 for plain x.y.z versions; null when either isn't plain. */
export function compareVersions(a: string, b: string): number | null {
  const x = PLAIN_SEMVER.exec(a);
  const y = PLAIN_SEMVER.exec(b);
  if (!x || !y) return null;
  for (let i = 1; i <= 3; i++) {
    const d = Number(x[i]) - Number(y[i]);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function bumpPatch(version: string): string {
  const m = PLAIN_SEMVER.exec(version)!;
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

/** JSON equality that ignores key order (the registry stores manifests as jsonb, which reorders keys). */
function sameJson(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(norm)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, norm((v as Record<string, unknown>)[k])]))
      : v;
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

type VersionPlan = { kind: "publish"; version: string } | { kind: "already-live" } | { kind: "behind"; live: string };
interface PlannedSkill { manifest: { name: string; version: string }; instructions?: string | null; tools?: unknown[] }

/** What to do given the live skill: publish the local version, publish live + 1 patch, nothing, or refuse. */
async function planVersion(registryUrl: string, skill: PlannedSkill): Promise<VersionPlan> {
  const local = skill.manifest.version;
  try {
    const res = await fetch(`${registryUrl}/api/skills/${encodeURIComponent(skill.manifest.name)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status !== 200) return { kind: "publish", version: local };
    const live = (await res.json()) as {
      version?: unknown; manifest?: Record<string, unknown>; instructions?: unknown; tools?: { tools?: unknown[] } | null;
    };
    if (typeof live.version !== "string") return { kind: "publish", version: local };
    const cmp = compareVersions(local, live.version);
    if (cmp === null || cmp > 0) return { kind: "publish", version: local };
    if (cmp < 0) return { kind: "behind", live: live.version };
    // Same version. Unchanged content (a re-run, or a retry after a timeout that landed) is already live.
    const strip = (m: Record<string, unknown> | undefined) => {
      const { version: _v, author: _a, ...rest } = m ?? {};
      return rest;
    };
    const unchanged =
      (live.instructions ?? null) === (skill.instructions ?? null) &&
      sameJson(live.tools?.tools ?? [], skill.tools ?? []) &&
      sameJson(strip(live.manifest), strip(skill.manifest as unknown as Record<string, unknown>));
    return unchanged ? { kind: "already-live" } : { kind: "publish", version: bumpPatch(live.version) };
  } catch {
    return { kind: "publish", version: local }; // the registry decides; a taken version comes back as 409
  }
}

/** Writes the new version into skill.json, changing only that value. False when it can't do so safely. */
function writeVersion(skillDir: string, oldVersion: string, newVersion: string): boolean {
  const file = join(skillDir, "skill.json");
  try {
    const text = readFileSync(file, "utf-8");
    const re = new RegExp(`("version"\\s*:\\s*")${oldVersion.replace(/\./g, "\\.")}(")`, "g");
    if ((text.match(re) ?? []).length !== 1) return false;
    writeFileSync(file, text.replace(re, `$1${newVersion}$2`));
    return true;
  } catch {
    return false;
  }
}

interface ErrorResponse {
  error?: string;
  message?: string;
  details?: string[];
}

export const publishCommand = new Command("publish")
  .description("Publish a Skill to the PolySkill registry")
  .argument("[directory]", "Skill directory to publish", ".")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("--no-bump", "Don't raise the version automatically when it is already published")
  .action(async (directory: string, options: { registry: string; bump: boolean }) => {
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

    // A version that is already live gets the next patch number, so an update is
    // just "edit, then publish" (no hand-editing skill.json each time).
    const localVersion = skill.manifest.version;
    if (options.bump) {
      const plan = await planVersion(registryUrl, skill);
      if (plan.kind === "already-live") {
        console.log(chalk.green(`\n${skill.manifest.name}@${localVersion} is already live with exactly this content. Nothing to publish.\n`));
        return;
      }
      if (plan.kind === "behind") {
        console.log(chalk.red(
          `\n${plan.live} is live, but skill.json says ${localVersion}: someone published newer work.` +
            `\nGet their changes first, or set "version" above ${plan.live} if yours should replace it.\n`
        ));
        process.exit(1);
      }
      if (plan.version !== localVersion) {
        console.log(chalk.dim(`  ${localVersion} is already published: publishing ${plan.version}`));
        skill.manifest.version = plan.version;
      }
    }

    // Build adapter outputs
    const adapters: Record<string, unknown> = {};
    for (const platform of skill.manifest.adapters) {
      const adapter = getAdapter(platform);
      if (adapter) {
        adapters[platform] = adapter.transpile(skill);
      } else {
        console.log(chalk.yellow(`  Skipping unknown adapter: ${platform}`));
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
        ? `Request timed out. A large skill can still finish on the server: check with polyskill search ${skill.manifest.name} before retrying.`
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
        console.log(chalk.dim("Skill names start with @<your GitHub username>/ or @<agent name>/ (a claimed agent may also use its owner's). Check: polyskill whoami\n"));
      } else {
        console.log(
          chalk.red(`\nPublish failed: ${error.error || error.message}`)
        );
        if (error.details) {
          for (const detail of error.details) {
            console.log(chalk.red(`  - ${detail}`));
          }
        }
        if (res.status === 409 && /version already exists/i.test(error.message ?? "")) {
          console.log(chalk.dim(
            skill.manifest.version !== localVersion
              ? `Someone published ${skill.manifest.version} at the same moment. Run polyskill publish again.`
              : `Version ${localVersion} is already published. Raise "version" in skill.json` +
                  (options.bump ? "." : ", or publish without --no-bump.")
          ));
        }
      }
      process.exit(1);
    }

    const result = await res.json() as { id: string };
    if (skill.manifest.version !== localVersion) {
      if (writeVersion(skillDir, localVersion, skill.manifest.version)) {
        console.log(chalk.dim(`  skill.json now says ${skill.manifest.version}`));
      } else {
        console.log(chalk.yellow(`  Couldn't update skill.json: set its "version" to ${skill.manifest.version} by hand`));
      }
    }
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
