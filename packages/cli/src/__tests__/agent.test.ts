import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
}));

vi.mock("../auth.js", () => ({
  setToken: vi.fn(),
}));

vi.mock("../config.js", () => ({
  REGISTRY_URL: "http://localhost:3000",
}));

import { agentCommand } from "../commands/agent.js";
import { input } from "@inquirer/prompts";
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
