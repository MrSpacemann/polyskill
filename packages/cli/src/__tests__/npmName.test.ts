import { describe, it, expect } from "vitest";
import { npmName } from "../npmName.js";

describe("npmName", () => {
  it("maps with a dot separator", () => {
    expect(npmName("@mrspacemann/seo-beast")).toBe("@polyskill/mrspacemann.seo-beast");
  });
  it("is injective across the hyphen boundary", () => {
    expect(npmName("@a/b-c")).not.toBe(npmName("@a-b/c"));
    expect(npmName("@a/b-c")).toBe("@polyskill/a.b-c");
    expect(npmName("@a-b/c")).toBe("@polyskill/a-b.c");
  });
  it("throws on malformed input", () => {
    expect(() => npmName("noscope")).toThrow();
    expect(() => npmName("@Bad/Caps")).toThrow();
    expect(() => npmName("@a/b/c")).toThrow();
  });
});
