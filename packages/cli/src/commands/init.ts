import { Command } from "commander";
import { input } from "@inquirer/prompts";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, "..", "templates");

async function loadTemplate(name: string): Promise<string> {
  return readFile(join(templatesDir, `${name}.template`), "utf-8");
}

function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export const initCommand = new Command("init")
  .description("Scaffold a new Skill project")
  .argument("[directory]", "Directory to create the skill in", ".")
  .action(async (directory: string) => {
    console.log(chalk.bold("\nPolySkill — Create a new Skill\n"));

    const skillName = await input({
      message: "Skill name (e.g. @yourname/my-skill):",
      validate: (val) =>
        /^@[a-z0-9-]+\/[a-z0-9-]+$/.test(val) ||
        "Must be scoped: @scope/name (lowercase, hyphens)",
    });

    const description = await input({
      message: "Description:",
      validate: (val) => val.length > 0 || "Description is required",
    });

    const authorName = await input({
      message: "Author name:",
      validate: (val) => val.length > 0 || "Author name is required",
    });

    const targetDir = resolve(process.cwd(), directory);
    await mkdir(targetDir, { recursive: true });

    const vars = { name: skillName, description, authorName };

    // Write skill.json
    const manifestTemplate = await loadTemplate("skill.json");
    await writeFile(
      join(targetDir, "skill.json"),
      fillTemplate(manifestTemplate, vars)
    );

    // Write tools.json
    const toolsTemplate = await loadTemplate("tools.json");
    await writeFile(join(targetDir, "tools.json"), toolsTemplate);

    // Write instructions.md
    const instructionsTemplate = await loadTemplate("instructions.md");
    await writeFile(join(targetDir, "instructions.md"), instructionsTemplate);

    console.log(chalk.green("\nSkill scaffolded successfully!"));
    console.log(`  ${chalk.dim(join(targetDir, "skill.json"))}`);
    console.log(`  ${chalk.dim(join(targetDir, "tools.json"))}`);
    console.log(`  ${chalk.dim(join(targetDir, "instructions.md"))}`);
    console.log(
      `\nNext steps:\n  1. Edit tools.json with your tool definitions\n  2. Edit instructions.md with your system prompt\n  3. Run ${chalk.cyan("polyskill validate")} to check\n  4. Run ${chalk.cyan("polyskill build")} to generate adapters\n`
    );
  });
