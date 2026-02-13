import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { loadSkill } from "../loader.js";
import { getAdapter, listAdapters } from "../adapters/index.js";

const fixtureDir = join(import.meta.dirname, "fixtures", "weather-skill");

describe("loadSkill", () => {
  it("loads a valid skill from disk", async () => {
    const skill = await loadSkill(fixtureDir);

    expect(skill.manifest.name).toBe("@test/weather-skill");
    expect(skill.tools).toHaveLength(2);
    expect(skill.tools[0].name).toBe("get_weather");
    expect(skill.tools[1].name).toBe("get_forecast");
    expect(skill.instructions).toContain("weather assistant");
  });

  it("throws on invalid manifest", async () => {
    const badDir = join(import.meta.dirname, "fixtures", "nonexistent");
    await expect(loadSkill(badDir)).rejects.toThrow();
  });
});

describe("adapter registry", () => {
  it("lists available adapters", () => {
    const adapters = listAdapters();
    expect(adapters).toContain("openai");
    expect(adapters).toContain("anthropic");
    expect(adapters).toContain("grok");
    expect(adapters).toContain("gemini");
    expect(adapters).toContain("kimi");
  });

  it("returns undefined for unknown adapter", () => {
    expect(getAdapter("unknown")).toBeUndefined();
  });
});

describe("OpenAI adapter", () => {
  it("transpiles a skill to OpenAI function-calling format", async () => {
    const skill = await loadSkill(fixtureDir);
    const adapter = getAdapter("openai")!;
    const result = adapter.transpile(skill);

    expect(result.platform).toBe("openai");
    expect(result.systemPrompt).toContain("weather assistant");
    expect(result.tools).toHaveLength(2);

    const tool = result.tools[0] as any;
    expect(tool.type).toBe("function");
    expect(tool.function.name).toBe("get_weather");
    expect(tool.function.description).toBe(
      "Get current weather for a location"
    );
    expect(tool.function.parameters.type).toBe("object");
    expect(tool.function.parameters.properties.location.type).toBe("string");
    expect(tool.function.parameters.required).toEqual(["location"]);
  });
});

describe("Anthropic adapter", () => {
  it("transpiles a skill to Anthropic tool-use format", async () => {
    const skill = await loadSkill(fixtureDir);
    const adapter = getAdapter("anthropic")!;
    const result = adapter.transpile(skill);

    expect(result.platform).toBe("anthropic");
    expect(result.systemPrompt).toContain("weather assistant");
    expect(result.tools).toHaveLength(2);

    const tool = result.tools[0] as any;
    expect(tool.name).toBe("get_weather");
    expect(tool.description).toBe("Get current weather for a location");
    expect(tool.input_schema.type).toBe("object");
    expect(tool.input_schema.properties.location.type).toBe("string");
    expect(tool.input_schema.required).toEqual(["location"]);
  });
});

describe("Grok adapter", () => {
  it("transpiles a skill to Grok function-calling format (OpenAI-compatible)", async () => {
    const skill = await loadSkill(fixtureDir);
    const adapter = getAdapter("grok")!;
    const result = adapter.transpile(skill);

    expect(result.platform).toBe("grok");
    expect(result.systemPrompt).toContain("weather assistant");
    expect(result.tools).toHaveLength(2);

    const tool = result.tools[0] as any;
    expect(tool.type).toBe("function");
    expect(tool.function.name).toBe("get_weather");
    expect(tool.function.description).toBe(
      "Get current weather for a location"
    );
    expect(tool.function.parameters.type).toBe("object");
    expect(tool.function.parameters.properties.location.type).toBe("string");
    expect(tool.function.parameters.required).toEqual(["location"]);
  });
});

describe("Gemini adapter", () => {
  it("transpiles a skill to Gemini functionDeclarations format", async () => {
    const skill = await loadSkill(fixtureDir);
    const adapter = getAdapter("gemini")!;
    const result = adapter.transpile(skill);

    expect(result.platform).toBe("gemini");
    expect(result.systemPrompt).toContain("weather assistant");
    expect(result.tools).toHaveLength(2);

    const tool = result.tools[0] as any;
    expect(tool.name).toBe("get_weather");
    expect(tool.description).toBe("Get current weather for a location");
    expect(tool.parameters.type).toBe("object");
    expect(tool.parameters.properties.location.type).toBe("string");
    expect(tool.parameters.required).toEqual(["location"]);
  });
});

describe("Kimi adapter", () => {
  it("transpiles a skill to Kimi function-calling format (OpenAI-compatible)", async () => {
    const skill = await loadSkill(fixtureDir);
    const adapter = getAdapter("kimi")!;
    const result = adapter.transpile(skill);

    expect(result.platform).toBe("kimi");
    expect(result.systemPrompt).toContain("weather assistant");
    expect(result.tools).toHaveLength(2);

    const tool = result.tools[0] as any;
    expect(tool.type).toBe("function");
    expect(tool.function.name).toBe("get_weather");
    expect(tool.function.description).toBe(
      "Get current weather for a location"
    );
    expect(tool.function.parameters.type).toBe("object");
    expect(tool.function.parameters.properties.location.type).toBe("string");
    expect(tool.function.parameters.required).toEqual(["location"]);
  });
});
