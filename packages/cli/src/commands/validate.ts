import { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { loadSkill } from "@polyskill/core";

export const validateCommand = new Command("validate")
  .description("Validate a Skill project")
  .argument("[directory]", "Skill directory to validate", ".")
  .action(async (directory: string) => {
    const skillDir = resolve(process.cwd(), directory);

    try {
      await loadSkill(skillDir);
      console.log(chalk.green("\nAll checks passed.\n"));
    } catch (err: any) {
      console.log(chalk.red(`\n${err.message}\n`));
      process.exit(1);
    }
  });
