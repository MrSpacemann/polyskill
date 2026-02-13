import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { initCommand } from "../commands/init.js";
import { input } from "@inquirer/prompts";
import { readFile, writeFile, mkdir } from "node:fs/promises";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("init command", () => {
  it("scaffolds a skill with all template files", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("@test/my-skill")   // name
      .mockResolvedValueOnce("A test skill")      // description
      .mockResolvedValueOnce("Test Author");      // author

    vi.mocked(readFile)
      .mockResolvedValueOnce('{"name":"{{name}}","description":"{{description}}","author":{"name":"{{authorName}}"}}')
      .mockResolvedValueOnce('{"tools":[]}')
      .mockResolvedValueOnce("# Instructions");

    await initCommand.parseAsync(["/tmp/new-skill"], { from: "user" });

    expect(mkdir).toHaveBeenCalledWith("/tmp/new-skill", { recursive: true });
    expect(writeFile).toHaveBeenCalledTimes(3);

    // skill.json should have variables substituted
    const skillJsonCall = vi.mocked(writeFile).mock.calls.find(
      (c) => (c[0] as string).endsWith("skill.json")
    );
    expect(skillJsonCall).toBeDefined();
    expect(skillJsonCall![1]).toContain("@test/my-skill");
    expect(skillJsonCall![1]).toContain("A test skill");
    expect(skillJsonCall![1]).toContain("Test Author");
  });

  it("creates target directory with recursive flag", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("@test/my-skill")
      .mockResolvedValueOnce("A test skill")
      .mockResolvedValueOnce("Test Author");

    vi.mocked(readFile)
      .mockResolvedValueOnce("{}")
      .mockResolvedValueOnce("{}")
      .mockResolvedValueOnce("");

    await initCommand.parseAsync(["/tmp/nested/dir"], { from: "user" });

    expect(mkdir).toHaveBeenCalledWith("/tmp/nested/dir", { recursive: true });
  });

  it("validates skill name must be scoped format", async () => {
    // Extract the validate function from the first input() call
    vi.mocked(input).mockImplementation(async (opts: any) => {
      if (opts.message.includes("Skill name")) {
        // Test the validate function
        const validate = opts.validate;
        expect(validate("@scope/name")).toBe(true);
        expect(validate("bad-name")).toBe("Must be scoped: @scope/name (lowercase, hyphens)");
        expect(validate("@UPPER/case")).toBe("Must be scoped: @scope/name (lowercase, hyphens)");
        return "@test/my-skill";
      }
      return "placeholder";
    });

    vi.mocked(readFile).mockResolvedValue("{}");

    await initCommand.parseAsync(["/tmp/test"], { from: "user" });
  });

  it("validates description is not empty", async () => {
    vi.mocked(input).mockImplementation(async (opts: any) => {
      if (opts.message.includes("Description")) {
        const validate = opts.validate;
        expect(validate("")).toBe("Description is required");
        expect(validate("Valid description")).toBe(true);
        return "A description";
      }
      return "@test/my-skill";
    });

    vi.mocked(readFile).mockResolvedValue("{}");

    await initCommand.parseAsync(["/tmp/test"], { from: "user" });
  });

  it("writes tools.json and instructions.md without variable substitution", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("@test/my-skill")
      .mockResolvedValueOnce("A test skill")
      .mockResolvedValueOnce("Test Author");

    vi.mocked(readFile)
      .mockResolvedValueOnce('{"name":"{{name}}"}')    // skill.json template
      .mockResolvedValueOnce('{"tools":[]}')            // tools.json template
      .mockResolvedValueOnce("# Instructions template"); // instructions.md template

    await initCommand.parseAsync(["/tmp/test"], { from: "user" });

    const toolsCall = vi.mocked(writeFile).mock.calls.find(
      (c) => (c[0] as string).endsWith("tools.json")
    );
    expect(toolsCall![1]).toBe('{"tools":[]}');

    const instructionsCall = vi.mocked(writeFile).mock.calls.find(
      (c) => (c[0] as string).endsWith("instructions.md")
    );
    expect(instructionsCall![1]).toBe("# Instructions template");
  });
});
