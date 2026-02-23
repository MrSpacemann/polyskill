import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import chalk from "chalk";
import { generateSkillMd, toSlug } from "./skill-md.js";

export const claudeCodeTarget = {
  name: "claude-code",
  dir: join(os.homedir(), ".claude", "skills"),

  async write(skill: any, _outputDir: string): Promise<void> {
    const slug = toSlug(skill.name);
    const skillDir = join(os.homedir(), ".claude", "skills", slug);
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      generateSkillMd(skill.manifest, skill.instructions ?? "")
    );
    console.log(chalk.dim(`  Location: ${skillDir}/SKILL.md`));
  },
};
