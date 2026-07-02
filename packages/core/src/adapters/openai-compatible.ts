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

/**
 * Build an adapter for a platform that uses the OpenAI function-calling
 * format (OpenAI, Grok, Kimi, ...). They differ only by platform name.
 */
export function openaiCompatibleAdapter(platform: string): Adapter {
  return {
    platform,

    transpile(skill: SkillDefinition): TranspileResult {
      return {
        platform,
        systemPrompt: skill.instructions,
        tools: skill.tools.map(transpileTool),
      };
    },
  };
}
