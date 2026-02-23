import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import chalk from "chalk";
import { generateSkillMd } from "./skill-md.js";

function toSlug(name: string): string {
  return name.replace(/^@/, "").replaceAll("/", "-");
}

function openCodeDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(os.homedir(), "AppData", "Roaming");
    return join(appData, "opencode", "skills");
  }
  return join(os.homedir(), ".config", "opencode", "skills");
}

export const opencodeTarget = {
  name: "opencode",
  dir: openCodeDir(),

  async write(skill: any): Promise<void> {
    const slug = toSlug(skill.name);
    const skillDir = join(openCodeDir(), slug);
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      generateSkillMd(skill.manifest, skill.instructions ?? "")
    );
    console.log(chalk.dim(`  Location: ${skillDir}/SKILL.md`));
  },
};
