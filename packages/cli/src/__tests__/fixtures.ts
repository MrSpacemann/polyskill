import type { SkillManifest, SkillDefinition, TranspileResult } from "@polyskill/core";

export const mockManifest: SkillManifest = {
  name: "@test/my-skill",
  version: "1.0.0",
  description: "A test skill",
  type: "tool",
  license: "MIT",
  author: { name: "Test Author" },
  skill: {
    instructions: "./instructions.md",
    tools: "./tools.json",
  },
  adapters: ["openai", "anthropic"],
};

export const mockSkill: SkillDefinition = {
  manifest: mockManifest,
  tools: [
    {
      name: "test_tool",
      description: "A test tool",
      parameters: {
        type: "object",
        properties: {
          input: { type: "string", description: "Test input" },
        },
        required: ["input"],
      },
    },
  ],
  instructions: "You are a test assistant.",
};

export const mockTranspileResult: TranspileResult = {
  platform: "openai",
  systemPrompt: "You are a test assistant.",
  tools: [
    {
      type: "function",
      function: {
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {
            input: { type: "string", description: "Test input" },
          },
          required: ["input"],
        },
      },
    },
  ],
};
