import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@polyskill/core", () => ({
  loadSkill: vi.fn(),
  getAdapter: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { publishCommand } from "../commands/publish.js";
import { loadSkill, getAdapter } from "@polyskill/core";
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
  vi.stubGlobal("fetch", vi.fn());
});

function mockFetchResponse(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 500 ? "Internal Server Error" : "Error",
    json: () => Promise.resolve(body),
  } as Response);
}

describe("publish command", () => {
  it("prints success on 201 response", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue({
      name: "openai",
      transpile: vi.fn().mockReturnValue(mockTranspileResult),
    });
    mockFetchResponse(201, { id: "test-uuid" });

    await publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Published @test/my-skill@1.0.0")
    );
    expect(process.exit).not.toHaveBeenCalled();
  });

  it("prints error and exits on 409 conflict", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(409, { error: "Conflict", message: "Version already exists" });

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Publish failed"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("prints details array on 400 response", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(400, {
      error: "Bad Request",
      message: "Invalid manifest",
      details: ["missing name", "missing version"],
    });

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("missing name"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("missing version"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("prints error and exits on 500 response", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(500, { message: "Internal Server Error" });

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Publish failed"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("sends correct request body to registry", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue({
      name: "openai",
      transpile: vi.fn().mockReturnValue(mockTranspileResult),
    });
    mockFetchResponse(201, { id: "test-uuid" });

    await publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/skills",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(callBody.manifest).toEqual(mockSkill.manifest);
    expect(callBody.tools).toEqual({ tools: mockSkill.tools });
    expect(callBody.instructions).toBe("You are a test assistant.");
    expect(callBody.adapters).toBeDefined();
  });

  it("sends tools as null when skill has no tools", async () => {
    const noToolsSkill = { ...mockSkill, tools: [] };
    vi.mocked(loadSkill).mockResolvedValue(noToolsSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(201, { id: "test-uuid" });

    await publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" });

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(callBody.tools).toBeNull();
  });

  it("prints error and exits on network failure", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Network error"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("prints error and exits when loadSkill fails", async () => {
    vi.mocked(loadSkill).mockRejectedValue(new Error("File not found"));

    await expect(
      publishCommand.parseAsync(["/tmp/bad-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("File not found"));
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
