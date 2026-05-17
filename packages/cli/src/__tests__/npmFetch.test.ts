import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "tar";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { fetchSkillFromNpm, NpmNotFound } from "../npmFetch.js";

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", vi.fn()); });

function makeTarball(skill: unknown): Buffer {
  const d = mkdtempSync(join(tmpdir(), "tb-"));
  mkdirSync(join(d, "package"));
  writeFileSync(join(d, "package", "skill.json"), JSON.stringify(skill));
  writeFileSync(join(d, "package", "package.json"), "{}");
  const out = join(d, "p.tgz");
  create({ sync: true, gzip: true, file: out, cwd: d }, ["package"]);
  return readFileSync(out);
}

describe("fetchSkillFromNpm", () => {
  it("resolves latest, downloads tarball, returns skill.json", async () => {
    const skill = { name: "@a/b", version: "2.0.0", instructions: "hi" };
    const tgz = makeTarball(skill);
    (fetch as any)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
        "dist-tags": { latest: "2.0.0" },
        versions: { "2.0.0": { dist: { tarball: "https://registry.npmjs.org/x/-/x-2.0.0.tgz" } } },
      }) })
      .mockResolvedValueOnce({ ok: true, status: 200, arrayBuffer: async () => tgz });
    const res = await fetchSkillFromNpm("@a/b");
    expect(res).toEqual(skill);
  });
  it("throws NpmNotFound on 404 packument", async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(fetchSkillFromNpm("@a/b")).rejects.toBeInstanceOf(NpmNotFound);
  });
});
