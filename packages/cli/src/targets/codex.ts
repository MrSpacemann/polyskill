import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import chalk from "chalk";
import { generateSkillMd, toSlug } from "./skill-md.js";

export function codexRootDir(): string {
  return process.env.CODEX_HOME || join(os.homedir(), ".codex");
}

const DIR = join(codexRootDir(), "skills");

export const codexTarget = {
  name: "codex",
  dir: DIR,

  async write(skill: any, _outputDir: string): Promise<void> {
    const slug = toSlug(skill.name);
    const skillDir = join(DIR, slug);
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      generateSkillMd(skill.manifest, skill.instructions ?? "")
    );
    console.log(chalk.dim(`  Location: ${skillDir}/SKILL.md`));
  },
};
