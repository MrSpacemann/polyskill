import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
}));

vi.mock("../auth.js", () => ({
  setToken: vi.fn(),
  getToken: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { agentCommand } from "../commands/agent.js";
import { input } from "@inquirer/prompts";
import { setToken, getToken } from "../auth.js";

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

const stdinWasTTY = process.stdin.isTTY;

beforeEach(() => {
  vi.clearAllMocks();
  // The prompt tests behave like a person at a terminal; the agent tests below set false.
  Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
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

describe("agent register command", () => {
  it("registers agent and stores API key on success", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("A test agent");
    mockFetchResponse(201, {
      id: "uuid-1",
      name: "myagent",
      api_key: "psk_agent_abc123",
      claim_url: "https://polyskill.ai/claim?id=uuid-1",
    });

    await agentCommand.parseAsync(["register"], { from: "user" });

    expect(setToken).toHaveBeenCalledWith("psk_agent_abc123");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("registered successfully")
    );
  });

  it("sends undefined description when empty", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    mockFetchResponse(201, {
      id: "uuid-1",
      name: "myagent",
      api_key: "psk_agent_abc123",
      claim_url: "https://polyskill.ai/claim?id=uuid-1",
    });

    await agentCommand.parseAsync(["register"], { from: "user" });

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(callBody.description).toBeUndefined();
  });

  it("exits on 409 name conflict", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("taken")
      .mockResolvedValueOnce("");
    mockFetchResponse(409, { error: "Conflict", message: "Agent name already registered" });

    await expect(
      agentCommand.parseAsync(["register"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("already registered")
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it("exits on server 400 response", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    mockFetchResponse(400, { error: "Bad Request", message: "Name must be 2-39 lowercase" });

    await expect(
      agentCommand.parseAsync(["register"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Registration failed")
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it("validates name format in prompt", async () => {
    // Run a flow to capture the validate callback from the input() mock
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    mockFetchResponse(201, {
      id: "uuid-1",
      name: "myagent",
      api_key: "psk_agent_abc123",
      claim_url: "https://polyskill.ai/claim?id=uuid-1",
    });

    await agentCommand.parseAsync(["register"], { from: "user" });

    const validateFn = vi.mocked(input).mock.calls[0][0].validate!;
    expect(validateFn("ab")).toBe(true);
    expect(validateFn("my-agent")).toBe(true);
    expect(validateFn("a")).toContain("2-39");
    expect(validateFn("MY-AGENT")).toContain("2-39");
    expect(validateFn("my--agent")).toContain("2-39");
  });

  it("exits on network failure", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      agentCommand.parseAsync(["register"], { from: "user" })
    ).rejects.toThrow(ExitError);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Failed to connect")
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it("prints security warning", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    mockFetchResponse(201, {
      id: "uuid-1",
      name: "myagent",
      api_key: "psk_agent_abc123",
      claim_url: "https://polyskill.ai/claim?id=uuid-1",
    });

    await agentCommand.parseAsync(["register"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("Security warning"))).toBe(true);
  });

  it("prints claim URL", async () => {
    vi.mocked(input)
      .mockResolvedValueOnce("myagent")
      .mockResolvedValueOnce("");
    mockFetchResponse(201, {
      id: "uuid-1",
      name: "myagent",
      api_key: "psk_agent_abc123",
      claim_url: "https://polyskill.ai/claim?id=uuid-1",
    });

    await agentCommand.parseAsync(["register"], { from: "user" });

    const calls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
    expect(calls.some((c) => c.includes("polyskill.ai/claim?id=uuid-1"))).toBe(true);
  });
});

afterAll(() => {
  Object.defineProperty(process.stdin, "isTTY", { value: stdinWasTTY, configurable: true });
});

function logged(): string[] {
  return vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
}

const REG = {
  id: "uuid-1",
  name: "builder-bot",
  api_key: "psk_agent_secretkey",
  claim_url: "https://polyskill.ai/claim?id=uuid-1&code=abcdefghijklmnop1234",
  claim_expires_at: "2099-01-01T00:00:00Z",
};
const LOCAL_LINK = "http://localhost:3000/claim?id=uuid-1&code=abcdefghijklmnop1234";

describe("agent register for agents (no prompts)", () => {
  it("--name and --description need no terminal and ask nothing", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
    mockFetchResponse(201, REG);
    await agentCommand.parseAsync(["register", "--name", "builder-bot", "--description", "Builds things"], { from: "user" });
    expect(input).not.toHaveBeenCalled();
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]!.body))).toEqual({ name: "builder-bot", description: "Builds things" });
    expect(setToken).toHaveBeenCalledWith("psk_agent_secretkey");
    // The link is on the registry the CLI talks to, with the server's code
    expect(logged().some((c) => c.includes(LOCAL_LINK))).toBe(true);
  });

  it("without --name and without a terminal it picks a valid name itself", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
    mockFetchResponse(201, REG);
    await agentCommand.parseAsync(["register"], { from: "user" });
    expect(input).not.toHaveBeenCalled();
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]!.body)).name).toMatch(/^agent-[a-z0-9-]+$/);
  });

  it("--json without --name never prompts, even on a terminal", async () => {
    mockFetchResponse(201, REG);
    await agentCommand.parseAsync(["register", "--json"], { from: "user" });
    expect(input).not.toHaveBeenCalled();
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]!.body)).name).toMatch(/^agent-/);
  });

  it("--json prints id, name, claim link and namespaces, never the key", async () => {
    mockFetchResponse(201, REG);
    await agentCommand.parseAsync(["register", "--name", "builder-bot", "--json"], { from: "user" });
    expect(input).not.toHaveBeenCalled();
    const out = JSON.parse(logged().join(""));
    expect(out).toEqual({
      id: "uuid-1",
      name: "builder-bot",
      claim_url: LOCAL_LINK,
      claim_expires_at: "2099-01-01T00:00:00Z",
      namespaces: ["@builder-bot/"],
    });
    expect(logged().join("")).not.toContain("psk_agent_secretkey");
  });

  it("refuses an invalid --name before calling the registry", async () => {
    await expect(agentCommand.parseAsync(["register", "--name", "Bad Name"], { from: "user" })).rejects.toThrow(ExitError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the registry's reason on 409 (e.g. a publisher's login)", async () => {
    mockFetchResponse(409, { message: "That name is a publisher's GitHub username." });
    await expect(agentCommand.parseAsync(["register", "--name", "alice"], { from: "user" })).rejects.toThrow(ExitError);
    expect(logged().some((c) => c.includes("publisher's GitHub username"))).toBe(true);
    expect(setToken).not.toHaveBeenCalled();
  });
});

describe("agent claim-link", () => {
  it("prints a fresh link for the saved agent key", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_saved");
    mockFetchResponse(200, { claim_url: REG.claim_url, claim_expires_at: "2099-01-01T00:00:00Z" });
    await agentCommand.parseAsync(["claim-link"], { from: "user" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/agents/me/claim-link",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer psk_agent_saved" }) }),
    );
    expect(logged().some((c) => c.includes(LOCAL_LINK))).toBe(true);
  });

  it("--json prints the link as JSON", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_saved");
    mockFetchResponse(200, { claim_url: REG.claim_url, claim_expires_at: "2099-01-01T00:00:00Z" });
    await agentCommand.parseAsync(["claim-link", "--json"], { from: "user" });
    expect(JSON.parse(logged().join(""))).toEqual({ claimed: false, claim_url: LOCAL_LINK, claim_expires_at: "2099-01-01T00:00:00Z" });
  });

  it("an already claimed agent is not an error", async () => {
    vi.mocked(getToken).mockReturnValue("psk_agent_saved");
    mockFetchResponse(409, { message: "Agent already claimed" });
    await agentCommand.parseAsync(["claim-link"], { from: "user" });
    expect(logged().some((c) => c.includes("already claimed"))).toBe(true);
  });

  it("needs a saved agent key, and says so for a revoked one", async () => {
    vi.mocked(getToken).mockReturnValue("ghp_human");
    await expect(agentCommand.parseAsync(["claim-link"], { from: "user" })).rejects.toThrow(ExitError);
    expect(fetch).not.toHaveBeenCalled();

    vi.mocked(getToken).mockReturnValue("psk_agent_revoked");
    mockFetchResponse(401, {});
    await expect(agentCommand.parseAsync(["claim-link"], { from: "user" })).rejects.toThrow(ExitError);
    expect(logged().some((c) => c.includes("revoked"))).toBe(true);
  });
});
