import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import chalk from "chalk";
import { generateSkillMd, toSlug } from "./skill-md.js";

export function openCodeRootDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(os.homedir(), "AppData", "Roaming");
    return join(appData, "opencode");
  }
  return join(os.homedir(), ".config", "opencode");
}

const DIR = join(openCodeRootDir(), "skills");

export const opencodeTarget = {
  name: "opencode",
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
