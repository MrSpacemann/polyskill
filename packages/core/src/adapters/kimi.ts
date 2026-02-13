import type { Adapter } from "./types.js";
import type { SkillDefinition, TranspileResult, CanonicalTool } from "../types.js";

/** Transpile a canonical tool to Kimi (Moonshot) function-calling format (OpenAI-compatible) */
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

export const kimiAdapter: Adapter = {
  platform: "kimi",

  transpile(skill: SkillDefinition): TranspileResult {
    return {
      platform: this.platform,
      systemPrompt: skill.instructions,
      tools: skill.tools.map(transpileTool),
    };
  },
};
