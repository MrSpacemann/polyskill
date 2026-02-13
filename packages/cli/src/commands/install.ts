/*
 * Install flow state machine:
 *
 * FETCH_REGISTRY ──→ CREATE_DIRS ──→ WRITE_FILES ──→ SUCCESS
 *        │
 *        ├──→ NOT_FOUND / HTTP_ERR
 *        │
 *        ▼
 *   NETWORK_ERR (DNS / timeout / refused)
 */

import { Command } from "commander";
import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import chalk from "chalk";
import { REGISTRY_URL } from "../config.js";

export const installCommand = new Command("install")
  .description("Install a Skill from the PolySkill registry")
  .argument("<name>", "Skill name (e.g. @author/skill-name)")
  .argument("[version]", "Specific version (defaults to latest)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .option("-o, --output <dir>", "Output directory", ".")
  .action(
    async (
      name: string,
      version: string | undefined,
      options: { registry: string; output: string }
    ) => {
      const registryUrl = options.registry;
      const outputDir = resolve(process.cwd(), options.output);

      console.log(chalk.bold(`\nInstalling ${name}${version ? `@${version}` : ""}...`));

      // Fetch from registry
      const encodedName = encodeURIComponent(name);
      const url = version
        ? `${registryUrl}/api/skills/${encodedName}/${version}`
        : `${registryUrl}/api/skills/${encodedName}`;

      let res: Response;
      try {
        res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      } catch (err: any) {
        const msg = err.name === "TimeoutError"
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

      // Track download (fire-and-forget for the user, but await for correctness)
      try {
        await fetch(`${registryUrl}/api/skills/${encodedName}/download`, {
          method: "POST",
          signal: AbortSignal.timeout(5_000),
        });
      } catch (_) {
        // Non-critical — don't block the install
      }

      // Create skill directory
      const skillDir = join(outputDir, "skills", skill.name.replaceAll("/", "__"));
      await mkdir(skillDir, { recursive: true });

      // Write manifest
      await writeFile(
        join(skillDir, "skill.json"),
        JSON.stringify(skill.manifest, null, 2)
      );

      // Write tools if present
      if (skill.tools) {
        await writeFile(
          join(skillDir, "tools.json"),
          JSON.stringify(skill.tools, null, 2)
        );
      }

      // Write instructions if present
      if (skill.instructions) {
        await writeFile(join(skillDir, "instructions.md"), skill.instructions);
      }

      // Write adapter outputs
      const adapterEntries = skill.adapters && typeof skill.adapters === "object"
        ? Object.entries(skill.adapters)
        : [];
      if (adapterEntries.length > 0) {
        const distDir = join(skillDir, "dist");
        await mkdir(distDir, { recursive: true });

        for (const [platform, output] of adapterEntries) {
          await writeFile(
            join(distDir, `${platform}.json`),
            JSON.stringify(output, null, 2)
          );
        }
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
      console.log(chalk.dim(`  Location: ${skillDir}`));
      console.log();
    }
  );
