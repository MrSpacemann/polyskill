import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@polyskill/core", () => ({
  loadSkill: vi.fn(),
  getAdapter: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

vi.mock("../auth.js", () => ({
  getToken: vi.fn(),
}));

import { publishCommand } from "../commands/publish.js";
import { loadSkill, getAdapter } from "@polyskill/core";
import { getToken } from "../auth.js";
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
  vi.mocked(getToken).mockReturnValue("ghp_testtoken");
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ghp_testtoken",
        },
      })
    );

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string); // the last call is the publish (the first looks up the live version)
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

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string); // the last call is the publish (the first looks up the live version)
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

  it("exits with message when no token is available", async () => {
    vi.mocked(getToken).mockReturnValue(null);

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Not authenticated"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("polyskill agent register"));
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("prints auth failure message on 401 response", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(401, { error: "Unauthorized", message: "Invalid or expired GitHub token" });

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Authentication failed"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("prints namespace hint on 403 response", async () => {
    vi.mocked(loadSkill).mockResolvedValue(mockSkill);
    vi.mocked(getAdapter).mockReturnValue(undefined);
    mockFetchResponse(403, { error: "Forbidden", message: "Skill name must start with @alice/" });

    await expect(
      publishCommand.parseAsync(["/tmp/test-skill"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Skill name must start with @alice/"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("polyskill whoami"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

describe("automatic version bump", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs") as typeof import("node:fs");
  const os = require("node:os") as typeof import("node:os");
  const path = require("node:path") as typeof import("node:path");

  function skillDir(version: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psk-bump-"));
    // compact arrays and a custom key order: only the version value may change
    fs.writeFileSync(path.join(dir, "skill.json"), `{\n  "name": "@test/my-skill",\n  "version": "${version}",\n  "adapters": ["openai", "anthropic"]\n}\n`);
    return dir;
  }

  function respond(...replies: Array<{ status: number; body: unknown }>) {
    for (const r of replies) {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        statusText: String(r.status),
        json: () => Promise.resolve(r.body),
      } as Response);
    }
  }

  function setup(localVersion: string) {
    vi.mocked(loadSkill).mockResolvedValue({ ...mockSkill, manifest: { ...mockSkill.manifest, version: localVersion } } as never);
    vi.mocked(getAdapter).mockReturnValue(undefined);
  }

  const posted = () => JSON.parse(String(vi.mocked(fetch).mock.calls.at(-1)![1]!.body)).manifest.version;

  it("a version that is already live goes out as the next patch, and skill.json follows", async () => {
    setup("1.0.0");
    const dir = skillDir("1.0.0");
    respond({ status: 200, body: { version: "1.0.0" } }, { status: 201, body: { id: "x" } });
    await publishCommand.parseAsync([dir], { from: "user" });
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("http://localhost:3000/api/skills/%40test%2Fmy-skill");
    expect(posted()).toBe("1.0.1");
    const text = fs.readFileSync(path.join(dir, "skill.json"), "utf-8");
    expect(text).toContain('"version": "1.0.1"');
    expect(text).toContain('"adapters": ["openai", "anthropic"]'); // formatting kept
  });

  it("bumps past the live version when the local one is behind it", async () => {
    setup("1.0.3");
    respond({ status: 200, body: { version: "1.0.5" } }, { status: 201, body: { id: "x" } });
    await publishCommand.parseAsync([skillDir("1.0.3")], { from: "user" });
    expect(posted()).toBe("1.0.6");
  });

  it("a newer local version, a new skill (404), a lookup error or a prerelease publish as is", async () => {
    for (const [local, reply] of [
      ["1.2.0", { status: 200, body: { version: "1.0.0" } }],
      ["1.0.0", { status: 404, body: {} }],
      ["1.0.0", { status: 503, body: {} }],
      ["1.0.0-beta.1", { status: 200, body: { version: "1.0.0" } }],
    ] as const) {
      vi.mocked(fetch).mockReset();
      setup(local);
      respond(reply, { status: 201, body: { id: "x" } });
      await publishCommand.parseAsync([skillDir(local)], { from: "user" });
      expect(posted()).toBe(local);
    }
  });

  it("--no-bump publishes the local version and explains a 409", async () => {
    setup("1.0.0");
    const dir = skillDir("1.0.0");
    respond({ status: 409, body: { error: "Conflict", message: "This skill name + version already exists" } });
    await expect(publishCommand.parseAsync([dir, "--no-bump"], { from: "user" })).rejects.toThrow(ExitError);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1); // no version lookup
    expect(posted()).toBe("1.0.0");
    const logged = vi.mocked(console.log).mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toContain("already published");
    expect(logged).toContain("--no-bump");
  });

  it("a failed publish leaves skill.json alone", async () => {
    setup("1.0.0");
    const dir = skillDir("1.0.0");
    respond({ status: 200, body: { version: "1.0.0" } }, { status: 500, body: { message: "boom" } });
    await expect(publishCommand.parseAsync([dir], { from: "user" })).rejects.toThrow(ExitError);
    expect(fs.readFileSync(path.join(dir, "skill.json"), "utf-8")).toContain('"version": "1.0.0"');
  });

  it("a network error during the lookup still publishes (the registry decides)", async () => {
    setup("1.0.0");
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
    respond({ status: 201, body: { id: "x" } });
    await publishCommand.parseAsync([skillDir("1.0.0")], { from: "user" });
    expect(posted()).toBe("1.0.0");
  });
});
