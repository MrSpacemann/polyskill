import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { searchCommand } from "../commands/search.js";

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

const twoSkillsResponse = {
  skills: [
    {
      name: "@openclaw/weather",
      version: "1.0.0",
      description: "Get weather forecasts.",
      type: "prompt",
      author_name: "openclaw",
      verified: true,
      downloads: 5,
    },
    {
      name: "@test/unverified-skill",
      version: "0.2.0",
      description: "An unverified skill.",
      type: "tool",
      author_name: "test",
      verified: false,
      downloads: 0,
    },
  ],
  total: 2,
};

function mockFetchResponse(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Internal Server Error",
    json: () => Promise.resolve(body),
  } as Response);
}

describe("search command", () => {
  it("prints formatted results for a query", async () => {
    mockFetchResponse(200, twoSkillsResponse);

    await searchCommand.parseAsync(["weather"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));

    // Should show both skill names
    expect(calls.some((c) => c.includes("@openclaw/weather"))).toBe(true);
    expect(calls.some((c) => c.includes("@test/unverified-skill"))).toBe(true);

    // Should show install commands
    expect(calls.some((c) => c.includes("polyskill install @openclaw/weather"))).toBe(true);

    // Should show verified/unverified badges
    expect(calls.some((c) => c.includes("verified"))).toBe(true);
    expect(calls.some((c) => c.includes("unverified"))).toBe(true);
  });

  it("passes query and filters to the API", async () => {
    mockFetchResponse(200, { skills: [], total: 0 });

    await searchCommand.parseAsync(
      ["weather", "--type", "tool", "--verified", "--author", "me", "--keyword", "nlp"],
      { from: "user" }
    );

    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("q=weather");
    expect(fetchUrl).toContain("type=tool");
    expect(fetchUrl).toContain("verified=true");
    expect(fetchUrl).toContain("author=me");
    expect(fetchUrl).toContain("keyword=nlp");
  });

  it("outputs raw JSON with --json flag", async () => {
    const response = { skills: [twoSkillsResponse.skills[0]], total: 1 };
    mockFetchResponse(200, response);

    await searchCommand.parseAsync(["weather", "--json"], { from: "user" });

    expect(console.log).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
  });

  it("shows no-results message when empty", async () => {
    mockFetchResponse(200, { skills: [], total: 0 });

    await searchCommand.parseAsync(["nonexistent"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("No skills found"))).toBe(true);
  });

  it("shows truncation message when total > shown", async () => {
    mockFetchResponse(200, {
      skills: [twoSkillsResponse.skills[0]],
      total: 50,
    });

    await searchCommand.parseAsync(["weather", "--limit", "1"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("Showing 1 of 50"))).toBe(true);
  });

  it("prints error and exits on network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      searchCommand.parseAsync(["weather"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Network error"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("prints error and exits on HTTP error", async () => {
    mockFetchResponse(500, {});

    await expect(
      searchCommand.parseAsync(["weather"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Search failed"));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("passes --category filter to the API", async () => {
    mockFetchResponse(200, { skills: [], total: 0 });

    await searchCommand.parseAsync(["--category", "coding-data"], { from: "user" });

    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("category=coding-data");
  });

  it("passes --sort filter to the API", async () => {
    mockFetchResponse(200, { skills: [], total: 0 });

    await searchCommand.parseAsync(["--sort", "downloads"], { from: "user" });

    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("sort=downloads");
  });

  it("works with no query (lists all skills)", async () => {
    mockFetchResponse(200, twoSkillsResponse);

    await searchCommand.parseAsync([], { from: "user" });

    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).not.toContain("q=");

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("@openclaw/weather"))).toBe(true);
  });
});
