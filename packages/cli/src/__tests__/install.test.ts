import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

vi.mock("../npmFetch.js", () => ({
  fetchSkillFromNpm: vi.fn(),
  NpmNotFound: class NpmNotFound extends Error {},
}));

import { installCommand } from "../commands/install.js";
import { fetchSkillFromNpm } from "../npmFetch.js";
import { writeFile, mkdir } from "node:fs/promises";

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

const fullSkillResponse = {
  name: "@test/my-skill",
  version: "1.0.0",
  manifest: { name: "@test/my-skill", version: "1.0.0" },
  tools: { tools: [{ name: "test_tool" }] },
  instructions: "You are a test assistant.",
  adapters: { openai: { platform: "openai" } },
  verified: true,
};

function mockFetchResponse(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : "Internal Server Error",
    json: () => Promise.resolve(body),
  } as Response);
}

describe("install command", () => {
  it("writes all files when skill has tools, instructions, and adapters", async () => {
    mockFetchResponse(200, fullSkillResponse);

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    // skill.json
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("skill.json"),
      expect.any(String)
    );
    // tools.json
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("tools.json"),
      expect.any(String)
    );
    // instructions.md
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("instructions.md"),
      "You are a test assistant."
    );
    // adapter output in dist/
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("dist/openai.json"),
      expect.any(String)
    );
    // dist directory created
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("dist"), { recursive: true });
  });

  it("writes only skill.json when skill has no tools/instructions/adapters", async () => {
    mockFetchResponse(200, {
      name: "@test/minimal",
      version: "1.0.0",
      manifest: { name: "@test/minimal" },
      tools: null,
      instructions: null,
      adapters: null,
      verified: true,
    });

    await installCommand.parseAsync(
      ["@test/minimal", "--output", "/tmp/output"],
      { from: "user" }
    );

    // Only skill.json should be written
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("skill.json"),
      expect.any(String)
    );
  });

  it("shows green badge for verified skills", async () => {
    mockFetchResponse(200, { ...fullSkillResponse, verified: true });

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("verified"));
    // Should NOT print the unverified warning
    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    const warningCall = calls.find((c) => c.includes("Warning"));
    expect(warningCall).toBeUndefined();
  });

  it("shows yellow badge and warning for unverified skills", async () => {
    mockFetchResponse(200, { ...fullSkillResponse, verified: false });

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("unverified"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Warning"));
  });

  it("prints error and exits on 404", async () => {
    mockFetchResponse(404, {});

    await expect(
      installCommand.parseAsync(
        ["@test/nonexistent", "--output", "/tmp/output"],
        { from: "user" }
      )
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Skill not found"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("falls back to npm on registry 500, then exits when npm also fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);
    vi.mocked(fetchSkillFromNpm).mockRejectedValueOnce(new Error("npm unreachable"));

    await expect(
      installCommand.parseAsync(
        ["@test/my-skill", "--output", "/tmp/output"],
        { from: "user" }
      )
    ).rejects.toThrow(ExitError);

    expect(fetchSkillFromNpm).toHaveBeenCalledWith("@test/my-skill", undefined);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("npm mirror"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("creates directory with scoped name replacing / with __", async () => {
    mockFetchResponse(200, fullSkillResponse);

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    // Should create skills/@test__my-skill directory
    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining("@test__my-skill"),
      { recursive: true }
    );
  });

  it("falls back to npm when registry is unreachable, then exits when npm also fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.mocked(fetchSkillFromNpm).mockRejectedValueOnce(new Error("npm unreachable"));

    await expect(
      installCommand.parseAsync(
        ["@test/my-skill", "--output", "/tmp/output"],
        { from: "user" }
      )
    ).rejects.toThrow(ExitError);

    expect(fetchSkillFromNpm).toHaveBeenCalledWith("@test/my-skill", undefined);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("npm mirror"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("does not create dist/ when adapters is empty object", async () => {
    mockFetchResponse(200, {
      ...fullSkillResponse,
      adapters: {},
    });

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    // skill dir created, but no dist dir
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(mkdir).not.toHaveBeenCalledWith(
      expect.stringContaining("dist"),
      expect.anything()
    );
    // No adapter files written
    expect(writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining("dist/"),
      expect.any(String)
    );
  });
});

describe("install command — npm mirror fallback", () => {
  it("falls back to npm when registry returns 403 (sandbox block)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    } as Response);
    vi.mocked(fetchSkillFromNpm).mockResolvedValueOnce(fullSkillResponse);

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    expect(fetchSkillFromNpm).toHaveBeenCalledWith("@test/my-skill", undefined);
    expect(writeFile).toHaveBeenCalled();
  });

  it("does NOT fall back to npm on registry 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(
      installCommand.parseAsync(
        ["@test/my-skill", "--output", "/tmp/output"],
        { from: "user" }
      )
    ).rejects.toMatchObject({ code: 1 });
    expect(fetchSkillFromNpm).not.toHaveBeenCalled();
  });

  it("falls back to npm when the registry fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("ENOTFOUND"));
    vi.mocked(fetchSkillFromNpm).mockResolvedValueOnce(fullSkillResponse);

    await installCommand.parseAsync(
      ["@test/my-skill", "--output", "/tmp/output"],
      { from: "user" }
    );

    expect(writeFile).toHaveBeenCalled();
  });
});
