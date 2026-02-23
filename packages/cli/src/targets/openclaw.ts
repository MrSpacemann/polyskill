import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import chalk from "chalk";
import { generateSkillMd } from "./skill-md.js";

function toSlug(name: string): string {
  return name.replace(/^@/, "").replaceAll("/", "-");
}

export const openclawTarget = {
  name: "openclaw",
  dir: join(os.homedir(), ".openclaw", "skills"),

  async write(skill: any): Promise<void> {
    const slug = toSlug(skill.name);
    const skillDir = join(os.homedir(), ".openclaw", "skills", slug);
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      generateSkillMd(skill.manifest, skill.instructions ?? "")
    );
    console.log(chalk.dim(`  Location: ${skillDir}/SKILL.md`));
  },
};
