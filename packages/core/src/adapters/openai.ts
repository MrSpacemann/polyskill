import type { Adapter } from "./types.js";
import type { SkillDefinition, TranspileResult, CanonicalTool } from "../types.js";

/** Transpile a canonical tool to OpenAI function-calling format */
function transpileTool(tool: CanonicalTool) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

export const openaiAdapter: Adapter = {
  platform: "openai",

  transpile(skill: SkillDefinition): TranspileResult {
    return {
      platform: this.platform,
      systemPrompt: skill.instructions,
      tools: skill.tools.map(transpileTool),
    };
  },
};
