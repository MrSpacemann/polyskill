import { describe, it, expect } from "vitest";
import { generateAgentName, AGENT_NAME_RE } from "../agentName.js";

describe("generateAgentName", () => {
  it("builds <prefix>-<computer>-<suffix> from the computer name", () => {
    expect(generateAgentName("cli", "Frederiks-MacBook-Air.local", "3f2a")).toBe("cli-frederiks-macbook-air-3f2a");
  });

  it("always fits the registry's name rule, whatever the computer is called", () => {
    for (const host of [
      "", ".", "---", "My  Weird__Host!!", "x".repeat(200), "ÆØÅ-laptop", "a--b", "-lead-", "host.with.dots.example.com",
      "z", "UPPER", "1234", "a-".repeat(40),
    ]) {
      const name = generateAgentName("cli", host, "ab12");
      expect(name, `${JSON.stringify(host)} → ${name}`).toMatch(AGENT_NAME_RE);
      expect(name.length).toBeLessThanOrEqual(39);
      expect(name.startsWith("cli-")).toBe(true);
    }
  });

  it("long names are cut so the suffix still fits, without a dangling hyphen", () => {
    const name = generateAgentName("agent", "a-very-long-computer-name-that-goes-on-and-on", "beef");
    expect(name).toMatch(AGENT_NAME_RE);
    expect(name.endsWith("-beef")).toBe(true);
    expect(name).not.toContain("--");
  });

  it("random suffixes differ between calls (two sign-ins don't clash)", () => {
    const names = new Set(Array.from({ length: 20 }, () => generateAgentName("cli", "host")));
    expect(names.size).toBeGreaterThan(15);
  });
});
