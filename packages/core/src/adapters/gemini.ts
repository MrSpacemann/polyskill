import type { Adapter } from "./types.js";
import type { SkillDefinition, TranspileResult, CanonicalTool } from "../types.js";

/** Transpile a canonical tool to Google Gemini functionDeclarations format */
function transpileTool(tool: CanonicalTool) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}

export const geminiAdapter: Adapter = {
  platform: "gemini",

  transpile(skill: SkillDefinition): TranspileResult {
    return {
      platform: this.platform,
      systemPrompt: skill.instructions,
      tools: skill.tools.map(transpileTool),
    };
  },
};
