/*
 * Install flow state machine (source of truth — keep in sync with logic):
 *
 *   FETCH_REGISTRY
 *     ├─ res.ok ─────────────────────────────────→ HAVE_SKILL
 *     ├─ status == 404 ──────────────────────────→ NOT_FOUND (exit 1)
 *     └─ throw | status 403 | status 5xx ────────→ FETCH_NPM
 *                                                    ├─ ok ──────→ HAVE_SKILL
 *                                                    └─ NpmNotFound
 *                                                       | throw ─→ BOTH_FAILED (exit 1)
 *
 *   HAVE_SKILL ──→ RESOLVE_TARGET ──→ WRITE_FILES ──→ SUCCESS
 *                       │                  └──→ WRITE_ERR (EACCES, ENOSPC, ...)
 *                       └──→ UNKNOWN_TARGET / AMBIGUOUS_TARGET
 *
 *   Download-count POST stays pointed at the registry and is best-effort
 *   (silently no-ops when the registry is unreachable).
 */

import { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { REGISTRY_URL } from "../config.js";
import { resolveTarget } from "../targets/index.js";
import { fetchSkillFromNpm, NpmNotFound } from "../npmFetch.js";

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

      let skill: any | undefined;
      let registryErr: string | undefined;
      let notFound = false;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (res.ok) {
          skill = await res.json();
        } else if (res.status === 404) {
          notFound = true;
        } else {
          registryErr = `registry returned ${res.status}`;
        }
      } catch (err: any) {
        registryErr =
          err.name === "TimeoutError"
            ? "registry request timed out"
            : `registry unreachable (${err.message})`;
      }

      // A genuine 404 from a reachable registry means the skill does not
      // exist — the npm mirror won't have it either. Handled outside the
      // try/catch so the exit isn't swallowed.
      if (notFound) {
        console.log(chalk.red(`\nSkill not found: ${name}`));
        process.exit(1);
      }

      if (!skill) {
        console.log(chalk.yellow(`\n${registryErr} — trying npm mirror...`));
        try {
          skill = await fetchSkillFromNpm(name, version);
          console.log(chalk.dim("  installed from npm mirror (registry.npmjs.org)"));
        } catch (npmErr: any) {
          if (npmErr instanceof NpmNotFound) {
            console.log(chalk.red(`\nSkill not found on registry or npm mirror: ${name}`));
          } else {
            console.log(
              chalk.red(`\nFailed via registry (${registryErr}) and npm mirror (${npmErr.message})`)
            );
          }
          process.exit(1);
        }
      }

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
