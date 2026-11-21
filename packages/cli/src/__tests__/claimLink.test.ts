import { describe, it, expect } from "vitest";
import { claimLinkFor } from "../claimLink.js";

describe("claimLinkFor", () => {
  const server = "https://polyskill.ai/claim?id=00000000-0000-4000-a000-000000000001&code=abc_DEF-123";

  it("moves the link onto the registry in use, keeping id and code", () => {
    expect(claimLinkFor("http://127.0.0.1:3298", server)).toBe(
      "http://127.0.0.1:3298/claim?id=00000000-0000-4000-a000-000000000001&code=abc_DEF-123",
    );
    expect(claimLinkFor("https://polyskill.ai/", server)).toBe(server);
  });

  it("keeps the server's link when it can't find an id and a code", () => {
    expect(claimLinkFor("http://x", "https://polyskill.ai/claim?id=1")).toBe("https://polyskill.ai/claim?id=1");
    expect(claimLinkFor("http://x", "not a url")).toBe("not a url");
  });
});
