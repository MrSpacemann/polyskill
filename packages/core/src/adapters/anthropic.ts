import type { Adapter } from "./types.js";
import type { SkillDefinition, TranspileResult, CanonicalTool } from "../types.js";

/** Transpile a canonical tool to Anthropic tool-use format */
function transpileTool(tool: CanonicalTool) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  };
}

export const anthropicAdapter: Adapter = {
  platform: "anthropic",

  transpile(skill: SkillDefinition): TranspileResult {
    return {
      platform: this.platform,
      systemPrompt: skill.instructions,
      tools: skill.tools.map(transpileTool),
    };
  },
};
