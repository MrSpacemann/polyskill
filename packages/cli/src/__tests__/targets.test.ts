import { describe, it, expect, vi, beforeEach } from "vitest";
import os from "node:os";
import path from "node:path";

// Mock fs/promises for write operations
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock node:fs for existsSync used in detectInstalledTargets
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { generateSkillMd, toSlug } from "../targets/skill-md.js";
import { detectInstalledTargets, resolveTarget, targetRegistry } from "../targets/index.js";
import { codexRootDir } from "../targets/codex.js";
import { installCommand } from "../commands/install.js";

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new ExitError(code as number);
  });
  vi.stubGlobal("fetch", vi.fn());
});

// ─── toSlug ──────────────────────────────────────────────────────────────────

describe("toSlug", () => {
  it("strips @ and replaces / with -", () => {
    expect(toSlug("@obra/superpowers")).toBe("obra-superpowers");
  });

  it("handles unscoped names (no @)", () => {
    expect(toSlug("simple-skill")).toBe("simple-skill");
  });

  it("handles deep scopes with multiple segments", () => {
    expect(toSlug("@scope/pkg/deep")).toBe("scope-pkg-deep");
  });
});

// ─── generateSkillMd ────────────────────────────────────────────────────────

describe("generateSkillMd", () => {
  it("produces correct frontmatter with keywords", () => {
    const manifest = {
      name: "@obra/superpowers",
      description: "Do amazing things",
      keywords: ["ai", "tools"],
    };
    const result = generateSkillMd(manifest, "You are helpful.");
    expect(result).toContain('name: "obra-superpowers"');
    expect(result).toContain('description: "Do amazing things"');
    expect(result).toContain('tags: ["ai", "tools"]');
    expect(result).toContain("You are helpful.");
  });

  it("omits metadata block when no keywords", () => {
    const manifest = { name: "@foo/bar", description: "Simple skill" };
    const result = generateSkillMd(manifest, "Instructions here.");
    expect(result).not.toContain("metadata:");
    expect(result).not.toContain("tags:");
    expect(result).toContain('name: "foo-bar"');
  });

  it("uses scoped slug for the name", () => {
    const manifest = { name: "@polyskill/getting-started", description: "Intro" };
    const result = generateSkillMd(manifest, "Body");
    expect(result).toContain('name: "polyskill-getting-started"');
    expect(result).not.toContain("@polyskill");
  });

  it("separates frontmatter and body with blank line", () => {
    const manifest = { name: "@a/b", description: "D" };
    const result = generateSkillMd(manifest, "Body text");
    const [frontmatter, ...bodyParts] = result.split("\n\n");
    expect(frontmatter).toMatch(/^---/);
    expect(frontmatter).toMatch(/---$/);
    expect(bodyParts.join("\n\n")).toContain("Body text");
  });

  it("wraps description containing : and # in double-quotes", () => {
    const manifest = {
      name: "@a/b",
      description: "A skill: does #things",
    };
    const result = generateSkillMd(manifest, "");
    expect(result).toContain('description: "A skill: does #things"');
  });

  it("escapes inner double-quotes in description", () => {
    const manifest = {
      name: "@a/b",
      description: 'Has "quotes" in it',
    };
    const result = generateSkillMd(manifest, "");
    expect(result).toContain('description: "Has \\"quotes\\" in it"');
  });

  it("escapes newlines in description", () => {
    const manifest = { name: "@a/b", description: "line1\nline2" };
    const result = generateSkillMd(manifest, "");
    expect(result).toContain('description: "line1\\nline2"');
  });

  it("quotes tag keywords containing special characters", () => {
    const manifest = {
      name: "@a/b",
      description: "D",
      keywords: ["safe", "has space", "has,comma"],
    };
    const result = generateSkillMd(manifest, "");
    expect(result).toContain('tags: ["safe", "has space", "has,comma"]');
  });
});

// ─── detectInstalledTargets ──────────────────────────────────────────────────

describe("detectInstalledTargets", () => {
  it("returns empty array when no runtimes exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    expect(detectInstalledTargets()).toEqual([]);
  });

  it("returns claude-code when ~/.claude exists", () => {
    vi.mocked(existsSync).mockImplementation((p) =>
      String(p) === path.join(os.homedir(), ".claude")
    );
    expect(detectInstalledTargets()).toContain("claude-code");
  });

  it("returns codex when ~/.codex exists", () => {
    vi.mocked(existsSync).mockImplementation((p) =>
      String(p) === path.join(os.homedir(), ".codex")
    );
    expect(detectInstalledTargets()).toEqual(["codex"]);
  });

  it("returns multiple targets when multiple roots exist", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const found = detectInstalledTargets();
    expect(found.length).toBeGreaterThan(1);
  });
});

// ─── codexRootDir ────────────────────────────────────────────────────────────

describe("codexRootDir", () => {
  it("defaults to ~/.codex", () => {
    delete process.env.CODEX_HOME;
    expect(codexRootDir()).toBe(path.join(os.homedir(), ".codex"));
  });

  it("uses CODEX_HOME env var when set", () => {
    process.env.CODEX_HOME = "/custom/codex";
    expect(codexRootDir()).toBe("/custom/codex");
    delete process.env.CODEX_HOME;
  });

  it("ignores empty CODEX_HOME", () => {
    process.env.CODEX_HOME = "";
    expect(codexRootDir()).toBe(path.join(os.homedir(), ".codex"));
    delete process.env.CODEX_HOME;
  });
});

// ─── resolveTarget ───────────────────────────────────────────────────────────

describe("resolveTarget", () => {
  it("returns specified target when --target flag given", () => {
    const target = resolveTarget("claude-code", false);
    expect(target.name).toBe("claude-code");
  });

  it("returns local target when --output flag given (no --target)", () => {
    const target = resolveTarget(undefined, true);
    expect(target.name).toBe("local");
  });

  it("exits with error for unknown target name", () => {
    expect(() => resolveTarget("unknown-runtime", false)).toThrow(ExitError);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("auto-detects single runtime and returns it", () => {
    vi.mocked(existsSync).mockImplementation((p) =>
      String(p) === path.join(os.homedir(), ".claude")
    );
    const target = resolveTarget(undefined, false);
    expect(target.name).toBe("claude-code");
  });

  it("exits with message when multiple runtimes detected", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    expect(() => resolveTarget(undefined, false)).toThrow(ExitError);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("falls back to local when no runtimes detected", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const target = resolveTarget(undefined, false);
    expect(target.name).toBe("local");
  });
});

// ─── install --target claude-code ───────────────────────────────────────────

const fullSkillResponse = {
  name: "@test/my-skill",
  version: "1.0.0",
  manifest: {
    name: "@test/my-skill",
    version: "1.0.0",
    description: "A test skill",
    keywords: ["test"],
  },
  tools: null,
  instructions: "You are a test assistant.",
  adapters: null,
  verified: true,
  downloads: 0,
};

function mockFetchOk(body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(body),
  } as Response);
}

describe("install command --target claude-code", () => {
  it("writes SKILL.md to ~/.claude/skills/<slug>/", async () => {
    mockFetchOk(fullSkillResponse);
    await installCommand.parseAsync(
      ["@test/my-skill", "--target", "claude-code"],
      { from: "user" }
    );

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining(path.join(".claude", "skills", "test-my-skill")),
      { recursive: true }
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("SKILL.md"),
      expect.stringContaining('name: "test-my-skill"')
    );
  });

  it("slug strips @ and replaces / with -", async () => {
    mockFetchOk(fullSkillResponse);
    await installCommand.parseAsync(
      ["@test/my-skill", "--target", "claude-code"],
      { from: "user" }
    );

    // slug should be test-my-skill (no @ or __)
    const mkdirCall = vi.mocked(mkdir).mock.calls[0][0] as string;
    expect(mkdirCall).toMatch(/test-my-skill/);
    expect(mkdirCall).not.toContain("@");
    expect(mkdirCall).not.toContain("__");
  });
});

describe("install command --output with non-local target", () => {
  it("warns when --output is passed alongside a non-local --target and still uses the correct target", async () => {
    mockFetchOk(fullSkillResponse);
    await installCommand.parseAsync(
      ["@test/my-skill", "--target", "claude-code", "--output", "/tmp/out"],
      { from: "user" }
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("--output is ignored")
    );
    // Skill was written to claude-code path, not --output dir
    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining(path.join(".claude", "skills", "test-my-skill")),
      { recursive: true }
    );
  });
});

describe("install command --target codex", () => {
  it("writes SKILL.md to ~/.codex/skills/<slug>/", async () => {
    mockFetchOk(fullSkillResponse);
    await installCommand.parseAsync(
      ["@test/my-skill", "--target", "codex"],
      { from: "user" }
    );

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining(path.join(".codex", "skills", "test-my-skill")),
      { recursive: true }
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("SKILL.md"),
      expect.stringContaining('name: "test-my-skill"')
    );
  });
});

describe("install command --target local", () => {
  it("writes files to ./skills/<name> with existing behavior", async () => {
    mockFetchOk(fullSkillResponse);
    await installCommand.parseAsync(
      ["@test/my-skill", "--target", "local"],
      { from: "user" }
    );

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining(path.join("skills", "@test__my-skill")),
      { recursive: true }
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("skill.json"),
      expect.any(String)
    );
  });
});
