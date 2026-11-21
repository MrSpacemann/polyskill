import { describe, it, expect, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}));

import { spawn } from "node:child_process";
import { browserCommand, openInBrowser } from "../browser.js";

const LINK = "https://polyskill.ai/claim?id=00000000-0000-4000-a000-000000000001&code=abc_DEF-123";

describe("browserCommand", () => {
  it("passes the whole link, & and code included, as one argument on every platform", () => {
    expect(browserCommand(LINK, "darwin")).toEqual(["open", [LINK]]);
    expect(browserCommand(LINK, "linux")).toEqual(["xdg-open", [LINK]]);
    // not `cmd /c start`, which cuts the link at & and drops the claim code
    const [cmd, args] = browserCommand(LINK, "win32");
    expect(args).toEqual(["url.dll,FileProtocolHandler", LINK]);
    // a full System32 path, never a bare name Windows would look up in the current folder
    expect(cmd).toMatch(/\\System32\\rundll32\.exe$/i);
    expect(cmd).not.toBe("rundll32");
  });
});

describe("openInBrowser", () => {
  it("opens http(s) links without a shell", () => {
    openInBrowser(LINK);
    const [, args, opts] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain(LINK);
    expect(opts).toMatchObject({ detached: true, stdio: "ignore" });
    expect((opts as { shell?: unknown }).shell).toBeUndefined();
  });

  it("ignores anything that isn't an http(s) link", () => {
    vi.mocked(spawn).mockClear();
    for (const bad of ["file:///etc/passwd", "javascript:alert(1)", "-x", "calc.exe"]) openInBrowser(bad);
    expect(spawn).not.toHaveBeenCalled();
  });
});
