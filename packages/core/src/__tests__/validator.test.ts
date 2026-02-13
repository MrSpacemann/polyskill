import { describe, it, expect } from "vitest";
import { validateManifest, validateTools } from "../validator.js";

const validManifest = {
  name: "@test/weather-skill",
  version: "1.0.0",
  description: "Get weather data",
  type: "tool",
  license: "MIT",
  author: { name: "Test Author" },
  skill: {
    instructions: "./instructions.md",
    tools: "./tools.json",
  },
  adapters: ["openai", "anthropic"],
};

const validTools = {
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
          units: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
          },
        },
        required: ["location"],
      },
    },
  ],
};

describe("validateManifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects manifest missing required fields", () => {
    const result = validateManifest({ name: "@test/x" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects manifest with invalid name format", () => {
    const result = validateManifest({
      ...validManifest,
      name: "no-scope",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("rejects manifest with invalid type", () => {
    const result = validateManifest({
      ...validManifest,
      type: "invalid",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("type"))).toBe(true);
  });

  it("rejects manifest with empty adapters array", () => {
    const result = validateManifest({
      ...validManifest,
      adapters: [],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts manifest with optional fields", () => {
    const result = validateManifest({
      ...validManifest,
      main: "./src/index.ts",
      keywords: ["weather", "api"],
      repository: "https://github.com/test/weather",
      dependencies: { "@other/skill": "^1.0.0" },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects version with trailing garbage", () => {
    const result = validateManifest({ ...validManifest, version: "1.0.0garbage" });
    expect(result.valid).toBe(false);
  });

  it("rejects manifest with extra properties", () => {
    const result = validateManifest({
      ...validManifest,
      unknown_field: "bad",
    });
    expect(result.valid).toBe(false);
  });

  it("accepts manifest with valid category", () => {
    const result = validateManifest({
      ...validManifest,
      category: "coding-data",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects manifest with invalid category", () => {
    const result = validateManifest({
      ...validManifest,
      category: "bogus",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("category"))).toBe(true);
  });
});

describe("validateTools", () => {
  it("accepts valid tools definition", () => {
    const result = validateTools(validTools);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects tools with missing name", () => {
    const result = validateTools({
      tools: [
        {
          description: "No name",
          parameters: { type: "object", properties: {} },
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects tools with invalid name format", () => {
    const result = validateTools({
      tools: [
        {
          name: "BadName",
          description: "Uppercase not allowed",
          parameters: { type: "object", properties: {} },
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects empty tools array", () => {
    const result = validateTools({ tools: [] });
    expect(result.valid).toBe(false);
  });

  it("accepts tools with returns field", () => {
    const result = validateTools({
      tools: [
        {
          ...validTools.tools[0],
          returns: {
            type: "object",
            properties: {
              temperature: { type: "number" },
            },
          },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects tools with extra properties on tool object", () => {
    const result = validateTools({
      tools: [
        {
          ...validTools.tools[0],
          extra: "not allowed",
        },
      ],
    });
    expect(result.valid).toBe(false);
  });
});
