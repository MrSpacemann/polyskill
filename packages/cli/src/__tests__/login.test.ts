import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@inquirer/prompts", () => ({
  password: vi.fn(),
}));

vi.mock("../auth.js", () => ({
  setToken: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { loginCommand } from "../commands/login.js";
import { password } from "@inquirer/prompts";
import { setToken } from "../auth.js";

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
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response);
}

// ── GitHub PAT ──────────────────────────────────────────────────

describe("login with GitHub PAT", () => {
  it("logs in successfully with ghp_ token", async () => {
    vi.mocked(password).mockResolvedValue("ghp_validtoken");
    mockFetchResponse(200, { login: "alice" });

    await loginCommand.parseAsync([], { from: "user" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer ghp_validtoken" }),
      })
    );
    expect(setToken).toHaveBeenCalledWith("ghp_validtoken");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Logged in as alice")
    );
  });

  it("exits on invalid GitHub token (401)", async () => {
    vi.mocked(password).mockResolvedValue("ghp_badtoken");
    mockFetchResponse(401, { message: "Bad credentials" });

    await expect(
      loginCommand.parseAsync([], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Invalid or expired GitHub token")
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it("exits on GitHub network failure", async () => {
    vi.mocked(password).mockResolvedValue("ghp_validtoken");
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      loginCommand.parseAsync([], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Failed to connect to GitHub API")
    );
    expect(setToken).not.toHaveBeenCalled();
  });
});

// ── Agent API key ───────────────────────────────────────────────

describe("login with agent API key", () => {
  it("logs in successfully with unclaimed agent", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: false });

    await loginCommand.parseAsync([], { from: "user" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/agents/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer psk_agent_abc123" }),
      })
    );
    expect(setToken).toHaveBeenCalledWith("psk_agent_abc123");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Logged in as agent myagent (Unclaimed)")
    );
  });

  it("logs in successfully with claimed agent", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: true });

    await loginCommand.parseAsync([], { from: "user" });

    expect(setToken).toHaveBeenCalledWith("psk_agent_abc123");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Logged in as agent myagent (Claimed)")
    );
  });

  it("shows claim URL for unclaimed agent", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: false });

    await loginCommand.parseAsync([], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("polyskill.ai/claim?id=uuid-1"))).toBe(true);
  });

  it("does not show claim URL for claimed agent", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: true });

    await loginCommand.parseAsync([], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("claim?id="))).toBe(false);
  });

  it("exits on invalid agent key (401)", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_invalid");
    mockFetchResponse(401, { error: "Unauthorized", message: "Invalid agent API key" });

    await expect(
      loginCommand.parseAsync([], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Invalid or expired agent API key")
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it("exits on registry network failure", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      loginCommand.parseAsync([], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Failed to connect to registry")
    );
    expect(setToken).not.toHaveBeenCalled();
  });
});

// ── Validation ──────────────────────────────────────────────────

describe("token validation", () => {
  it("accepts ghp_, github_pat_, and psk_agent_ prefixes", async () => {
    // Run one flow to capture the validate callback from the password() mock
    vi.mocked(password).mockResolvedValue("ghp_test");
    mockFetchResponse(200, { login: "alice" });
    await loginCommand.parseAsync([], { from: "user" });

    const validateFn = vi.mocked(password).mock.calls[0][0].validate!;
    expect(validateFn("ghp_valid")).toBe(true);
    expect(validateFn("github_pat_valid")).toBe(true);
    expect(validateFn("psk_agent_valid")).toBe(true);
  });

  it("rejects tokens without recognized prefix", async () => {
    vi.mocked(password).mockResolvedValue("ghp_test");
    mockFetchResponse(200, { login: "alice" });
    await loginCommand.parseAsync([], { from: "user" });

    const validateFn = vi.mocked(password).mock.calls[0][0].validate!;
    expect(validateFn("random_token")).toBe("Token must start with ghp_, github_pat_, or psk_agent_");
    expect(validateFn("sk_live_something")).toBe("Token must start with ghp_, github_pat_, or psk_agent_");
  });
});
