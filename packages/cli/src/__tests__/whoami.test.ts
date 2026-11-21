import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../auth.js", () => ({ getToken: vi.fn() }));
vi.mock("../config.js", () => ({ REGISTRY_URL: "http://localhost:3000" }));

import { whoamiCommand } from "../commands/whoami.js";
import { getToken } from "../auth.js";

class ExitError extends Error {
  constructor(public code: number) { super(`process.exit(${code})`); }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation((code) => { throw new ExitError(code as number); });
  vi.stubGlobal("fetch", vi.fn());
});

function reply(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
}
const out = () => vi.mocked(console.log).mock.calls.map((c) => String(c[0])).join("\n");

describe("whoami", () => {
  it("not signed in: exits 1 and says how to sign in", async () => {
    vi.mocked(getToken).mockReturnValue(null);
    await expect(whoamiCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(out()).toContain("polyskill login");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("a claimed agent key: shows the owner and both namespaces", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_k");
    reply(200, { name: "cli-mac-1a2b", claimed: true, owner_login: "Alice", namespaces: ["@cli-mac-1a2b/", "@alice/"] });
    await whoamiCommand.parseAsync([], { from: "user" });
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/api/agents/me", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer psk_agent_k" }),
    }));
    expect(out()).toContain("@Alice");
    expect(out()).toContain("@alice/");
  });

  it("an unclaimed agent key: says how to get a claim link", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_k");
    reply(200, { name: "bot", claimed: false, namespaces: ["@bot/"] });
    await whoamiCommand.parseAsync([], { from: "user" });
    expect(out()).toContain("not claimed");
    expect(out()).toContain("polyskill agent claim-link");
  });

  it("--json for an agent: the facts, never the key", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_secret");
    reply(200, { name: "bot", claimed: true, owner_login: "Alice", namespaces: ["@bot/", "@alice/"] });
    await whoamiCommand.parseAsync(["--json"], { from: "user" });
    expect(JSON.parse(out())).toEqual({ kind: "agent", agent: "bot", claimed: true, owner: "Alice", namespaces: ["@bot/", "@alice/"] });
    expect(out()).not.toContain("psk_agent_secret");
  });

  it("a revoked agent key exits 1", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_k");
    reply(401, {});
    await expect(whoamiCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
    expect(out()).toContain("revoked");
  });

  it("a GitHub token: asks GitHub who it is", async () => {
    vi.mocked(getToken).mockReturnValue("ghp_x");
    reply(200, { login: "Alice" });
    await whoamiCommand.parseAsync(["--json"], { from: "user" });
    expect(fetch).toHaveBeenCalledWith("https://api.github.com/user", expect.anything());
    expect(JSON.parse(out())).toEqual({ kind: "github", login: "Alice", namespaces: ["@alice/"] });
  });

  it("an expired GitHub token exits 1", async () => {
    vi.mocked(getToken).mockReturnValue("ghp_x");
    reply(401, {});
    await expect(whoamiCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
  });

  it("can't reach the registry: exits 1", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_k");
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
    await expect(whoamiCommand.parseAsync([], { from: "user" })).rejects.toThrow(ExitError);
  });
});
