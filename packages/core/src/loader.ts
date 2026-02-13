import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillManifest, SkillDefinition, ToolsFile } from "./types.js";
import { validateManifest, validateTools } from "./validator.js";

/** Load a Skill from a directory on disk into a fully resolved SkillDefinition */
export async function loadSkill(skillDir: string): Promise<SkillDefinition> {
  // Read and validate manifest
  const manifestPath = join(skillDir, "skill.json");
  const manifestRaw = await readFile(manifestPath, "utf-8");
  const manifest: SkillManifest = JSON.parse(manifestRaw);

  const manifestResult = validateManifest(manifest);
  if (!manifestResult.valid) {
    throw new Error(
      `Invalid skill.json:\n${manifestResult.errors.join("\n")}`
    );
  }

  // Load tools if referenced
  let tools: SkillDefinition["tools"] = [];
  if (manifest.skill.tools) {
    const toolsPath = join(skillDir, manifest.skill.tools);
    const toolsRaw = await readFile(toolsPath, "utf-8");
    const toolsFile: ToolsFile = JSON.parse(toolsRaw);

    const toolsResult = validateTools(toolsFile);
    if (!toolsResult.valid) {
      throw new Error(
        `Invalid tools.json:\n${toolsResult.errors.join("\n")}`
      );
    }
    tools = toolsFile.tools;
  }

  // Load instructions if referenced
  let instructions: string | null = null;
  if (manifest.skill.instructions) {
    const instructionsPath = join(skillDir, manifest.skill.instructions);
    instructions = await readFile(instructionsPath, "utf-8");
  }

  return { manifest, tools, instructions };
}
