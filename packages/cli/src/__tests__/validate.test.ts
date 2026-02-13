import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@polyskill/core", () => ({
  loadSkill: vi.fn(),
}));

import { validateCommand } from "../commands/validate.js";
import { loadSkill } from "@polyskill/core";
import { mockSkill } from "./fixtures.js";

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

describe("validate command", () => {
  it("prints success when loadSkill resolves", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);

    await validateCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(loadSkill).toHaveBeenCalledWith("/tmp/test-skill");
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("All checks passed"));
    expect(process.exit).not.toHaveBeenCalled();
  });

  it("prints error and exits when loadSkill throws", async () => {
    vi.mocked(loadSkill).mockRejectedValue(new Error("Invalid manifest"));

    await expect(
      validateCommand.parseAsync(["/tmp/bad-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Invalid manifest"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("resolves relative directory to absolute path", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);

    await validateCommand.parseAsync(["my-skill"], { from: "user" });

    const calledWith = vi.mocked(loadSkill).mock.calls[0][0];
    // Should be an absolute path, not "my-skill"
    expect(calledWith).toMatch(/^\//);
    expect(calledWith).toContain("my-skill");
  });
});
