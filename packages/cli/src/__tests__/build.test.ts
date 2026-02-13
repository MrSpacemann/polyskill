import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@polyskill/core", () => ({
  loadSkill: vi.fn(),
  getAdapter: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { buildCommand } from "../commands/build.js";
import { loadSkill, getAdapter } from "@polyskill/core";
import { writeFile, mkdir } from "node:fs/promises";
import { mockSkill, mockTranspileResult } from "./fixtures.js";

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
});

describe("build command", () => {
  it("builds adapter outputs for each platform", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue({
      name: "openai",
      transpile: vi.fn().mockReturnValue(mockTranspileResult),
    });

    await buildCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(mkdir).toHaveBeenCalledWith("/tmp/test-skill/dist", { recursive: true });
    // 2 adapters in mockSkill.manifest: openai, anthropic
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/test-skill/dist/openai.json",
      expect.any(String)
    );
    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/test-skill/dist/anthropic.json",
      expect.any(String)
    );
  });

  it("skips unknown adapters with a warning", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter)
      .mockReturnValueOnce(undefined)  // openai → unknown
      .mockReturnValueOnce({      // anthropic → known
        name: "anthropic",
        transpile: vi.fn().mockReturnValue(mockTranspileResult),
      });

    await buildCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Skipping unknown adapter"));
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it("creates dist directory with recursive flag", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue({
      name: "openai",
      transpile: vi.fn().mockReturnValue(mockTranspileResult),
    });

    await buildCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("dist"), { recursive: true });
  });

  it("prints error and exits when loadSkill fails", async () => {
    vi.mocked(loadSkill).mockRejectedValue(new Error("Missing skill.json"));

    await expect(
      buildCommand.parseAsync(["/tmp/bad-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Missing skill.json"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
