/*
 * Build flow state machine:
 *
 * LOAD_SKILL ──→ CREATE_DIST ──→ TRANSPILE_EACH ──→ SUCCESS
 *      │                │               │
 *      ▼                ▼               ▼
 *   LOAD_ERR       DIR_ERR         WRITE_ERR
 */

import { Command } from "commander";
import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import chalk from "chalk";
import { loadSkill, getAdapter } from "@polyskill/core";

export const buildCommand = new Command("build")
  .description("Build platform-specific adapter outputs")
  .argument("[directory]", "Skill directory to build", ".")
  .action(async (directory: string) => {
    const skillDir = resolve(process.cwd(), directory);

    console.log(chalk.bold("\nBuilding skill..."));

    try {
      // Load and validate skill
      const skill = await loadSkill(skillDir);
      const distDir = join(skillDir, "dist");
      await mkdir(distDir, { recursive: true });

      const adapters = skill.manifest.adapters;
      for (const platform of adapters) {
        const adapter = getAdapter(platform);
        if (!adapter) {
          console.log(
            chalk.yellow(`  Skipping unknown adapter: ${platform}`)
          );
          continue;
        }

        const result = adapter.transpile(skill);
        const outputPath = join(distDir, `${platform}.json`);
        await writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(chalk.green(`  Built ${platform} → ${outputPath}`));
      }

      console.log(chalk.green("\nBuild complete.\n"));
    } catch (err: any) {
      console.log(chalk.red(`\n${err.message}\n`));
      process.exit(1);
    }
  });
