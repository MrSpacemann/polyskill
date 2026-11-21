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

vi.mock("../browser.js", () => ({ openInBrowser: vi.fn() }));
vi.mock("../sleep.js", () => ({ sleep: vi.fn(() => Promise.resolve()) }));

import { loginCommand } from "../commands/login.js";
import { password } from "@inquirer/prompts";
import { setToken } from "../auth.js";
import { openInBrowser } from "../browser.js";
import { sleep } from "../sleep.js";

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

    await loginCommand.parseAsync(["--token"], { from: "user" });

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
      loginCommand.parseAsync(["--token"], { from: "user" })
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
      loginCommand.parseAsync(["--token"], { from: "user" })
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

    await loginCommand.parseAsync(["--token"], { from: "user" });

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
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: true, owner_login: "Alice", namespaces: ["@myagent/", "@alice/"] });

    await loginCommand.parseAsync(["--token"], { from: "user" });

    expect(setToken).toHaveBeenCalledWith("psk_agent_abc123");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Logged in as agent myagent (Claimed by @Alice)")
    );
    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("@alice/"))).toBe(true);
  });

  it("tells an unclaimed agent how to get a claim link (a link without its code wouldn't work)", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: false });

    await loginCommand.parseAsync(["--token"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("polyskill agent claim-link"))).toBe(true);
    expect(calls.some((c) => c.includes("claim?id="))).toBe(false);
  });

  it("does not show claim URL for claimed agent", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_abc123");
    mockFetchResponse(200, { id: "uuid-1", name: "myagent", claimed: true });

    await loginCommand.parseAsync(["--token"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("claim-link"))).toBe(false);
  });

  it("exits on invalid agent key (401)", async () => {
    vi.mocked(password).mockResolvedValue("psk_agent_invalid");
    mockFetchResponse(401, { error: "Unauthorized", message: "Invalid agent API key" });

    await expect(
      loginCommand.parseAsync(["--token"], { from: "user" })
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
      loginCommand.parseAsync(["--token"], { from: "user" })
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
    await loginCommand.parseAsync(["--token"], { from: "user" });

    const validateFn = vi.mocked(password).mock.calls[0][0].validate!;
    expect(validateFn("ghp_valid")).toBe(true);
    expect(validateFn("github_pat_valid")).toBe(true);
    expect(validateFn("psk_agent_valid")).toBe(true);
  });

  it("rejects tokens without recognized prefix", async () => {
    vi.mocked(password).mockResolvedValue("ghp_test");
    mockFetchResponse(200, { login: "alice" });
    await loginCommand.parseAsync(["--token"], { from: "user" });

    const validateFn = vi.mocked(password).mock.calls[0][0].validate!;
    expect(validateFn("random_token")).toBe("Token must start with ghp_, github_pat_, or psk_agent_");
    expect(validateFn("sk_live_something")).toBe("Token must start with ghp_, github_pat_, or psk_agent_");
  });
});

// ── Browser sign-in (the default) ───────────────────────────────

const REGISTERED = {
  id: "00000000-0000-4000-a000-000000000001",
  name: "cli-test-abcd",
  api_key: "psk_agent_new",
  claim_url: "https://polyskill.ai/claim?id=00000000-0000-4000-a000-000000000001&code=SECRETcode_1234567890",
  claim_expires_at: "2099-01-01T00:00:00Z",
};

function reply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as Response;
}

function logged(): string[] {
  return vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
}

describe("login in the browser (default)", () => {
  it("registers, shows the link, waits for the claim, then saves the key", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(201, REGISTERED))
      .mockResolvedValueOnce(reply(200, { claimed: false, claimable: true }))
      .mockResolvedValueOnce(reply(200, { claimed: true, claimable: false, owner_login: "Alice" }));

    await loginCommand.parseAsync([], { from: "user" });

    const register = vi.mocked(fetch).mock.calls[0];
    expect(register[0]).toBe("http://localhost:3000/api/agents/register");
    expect(JSON.parse(String(register[1]!.body)).name).toMatch(/^cli-[a-z0-9-]+$/);
    // The link points at the registry we talk to, with the server's code
    expect(logged().some((c) => c.includes("http://localhost:3000/claim?id=00000000-0000-4000-a000-000000000001&code=SECRETcode_1234567890"))).toBe(true);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("http://localhost:3000/api/agents/me");
    expect(setToken).toHaveBeenCalledWith("psk_agent_new");
    expect(setToken).toHaveBeenCalledTimes(1);
    // A pause before every check: without it the CLI would poll back-to-back into the rate limit
    expect(vi.mocked(sleep).mock.calls).toEqual([[5000], [5000]]);
    expect(logged().some((c) => c.includes("Signed in as @Alice"))).toBe(true);
    // The key itself is never printed
    expect(logged().some((c) => c.includes("psk_agent_new"))).toBe(false);
  });

  it("never opens a browser when stdout isn't a terminal or with --no-browser", async () => {
    for (const args of [[], ["--no-browser"]]) {
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
      await loginCommand.parseAsync(args, { from: "user" });
    }
    expect(openInBrowser).not.toHaveBeenCalled(); // vitest's stdout is not a TTY
  });

  it("opens the browser on a terminal, and not with --no-browser", async () => {
    const was = process.stdout.isTTY;
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    try {
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
      await loginCommand.parseAsync([], { from: "user" });
      expect(openInBrowser).toHaveBeenCalledWith(expect.stringContaining("/claim?id="));

      vi.mocked(openInBrowser).mockClear();
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
      await loginCommand.parseAsync(["--no-browser"], { from: "user" });
      expect(openInBrowser).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(process.stdout, "isTTY", { value: was, configurable: true });
    }
  });

  it("an expired link exits 1 and saves nothing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(201, REGISTERED))
      .mockResolvedValueOnce(reply(200, { claimed: false, claimable: false }));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(setToken).not.toHaveBeenCalled();
    expect(logged().some((c) => c.includes("expired"))).toBe(true);
  });

  it("the server's expiry time doesn't decide (a wrong laptop clock): it still waits for the claim", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(201, { ...REGISTERED, claim_expires_at: "2000-01-01T00:00:00Z" }))
      .mockResolvedValueOnce(reply(200, { claimed: false, claimable: true }))
      .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
    await loginCommand.parseAsync([], { from: "user" });
    expect(setToken).toHaveBeenCalledWith("psk_agent_new");
  });

  it("past its own deadline it makes one last check, then exits 1 saving nothing", async () => {
    const start = Date.now();
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(start); // the deadline is set from this
    now.mockReturnValue(start + 62 * 60_000); // every later look: past it
    try {
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(200, { claimed: false, claimable: true }));
      await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2); // register + the one last check
      expect(setToken).not.toHaveBeenCalled();
    } finally {
      now.mockRestore();
    }
  });

  it("a claim that lands on that last check is still saved", async () => {
    const start = Date.now();
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(start);
    now.mockReturnValue(start + 62 * 60_000);
    try {
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
      await loginCommand.parseAsync([], { from: "user" });
      expect(setToken).toHaveBeenCalledWith("psk_agent_new");
    } finally {
      now.mockRestore();
    }
  });

  it("a long Retry-After never sleeps past the deadline", async () => {
    const start = Date.now();
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(start);
    now.mockReturnValue(start + 61 * 60_000 - 2_000); // 2 s left
    try {
      vi.mocked(fetch)
        .mockResolvedValueOnce(reply(201, REGISTERED))
        .mockResolvedValueOnce(reply(429, {}, { "retry-after": "900" }));
      await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
      for (const [ms] of vi.mocked(sleep).mock.calls) expect(ms).toBeLessThanOrEqual(2_000);
    } finally {
      now.mockRestore();
    }
  });

  it("a name clash (409) retries with a new name, then gives up after 3", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(409, { message: "taken" }))
      .mockResolvedValueOnce(reply(201, REGISTERED))
      .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
    await loginCommand.parseAsync([], { from: "user" });
    expect(setToken).toHaveBeenCalledWith("psk_agent_new");
    const tried = vi.mocked(fetch).mock.calls.slice(0, 2).map((c) => JSON.parse(String(c[1]!.body)).name);
    expect(tried[0]).not.toBe(tried[1]); // the retry used a new name

    vi.mocked(fetch).mockReset();
    vi.mocked(setToken).mockClear();
    vi.mocked(fetch).mockResolvedValue(reply(409, { message: "taken" }));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
    expect(setToken).not.toHaveBeenCalled();
  });

  it("too many sign-ins (429) exits 1 and points at --token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(reply(429, {}));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(logged().some((c) => c.includes("--token"))).toBe(true);
  });

  it("while waiting: a 429 waits Retry-After, network blips are retried, then the claim lands", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(201, REGISTERED))
      .mockResolvedValueOnce(reply(429, {}, { "retry-after": "7" }))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(reply(503, {}))
      .mockResolvedValueOnce(reply(200, { claimed: true, owner_login: "Alice" }));
    await loginCommand.parseAsync([], { from: "user" });
    expect(sleep).toHaveBeenCalledWith(7000);
    expect(setToken).toHaveBeenCalledWith("psk_agent_new");
  });

  it("gives up after 12 failures in a row while waiting, saving nothing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(reply(201, REGISTERED));
    for (let i = 0; i < 12; i++) vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(13);
    expect(setToken).not.toHaveBeenCalled();
  });

  it("a key revoked while waiting (401) exits 1, saving nothing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(reply(201, REGISTERED))
      .mockResolvedValueOnce(reply(401, {}));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(setToken).not.toHaveBeenCalled();
  });

  it("can't reach the registry to start: exits 1", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(loginCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(setToken).not.toHaveBeenCalled();
  });
});
