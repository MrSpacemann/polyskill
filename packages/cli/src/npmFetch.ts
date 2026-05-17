import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { x } from "tar";
import { npmName } from "./npmName.js";

const NPM_REGISTRY = "https://registry.npmjs.org";

export class NpmNotFound extends Error {}

export async function fetchSkillFromNpm(
  skillName: string,
  version?: string
): Promise<any> {
  const pkg = npmName(skillName);
  const metaRes = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(pkg)}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (metaRes.status === 404) throw new NpmNotFound(`npm mirror not found: ${pkg}`);
  if (!metaRes.ok) throw new Error(`npm registry error: ${metaRes.status}`);
  const meta = (await metaRes.json()) as any;

  const v = version ?? meta?.["dist-tags"]?.latest;
  const tarball = v && meta?.versions?.[v]?.dist?.tarball;
  if (!tarball) throw new NpmNotFound(`npm mirror has no version ${v ?? "latest"} for ${pkg}`);

  const tgzRes = await fetch(tarball, { signal: AbortSignal.timeout(30_000) });
  if (!tgzRes.ok) throw new Error(`npm tarball error: ${tgzRes.status}`);
  const buf = Buffer.from(await tgzRes.arrayBuffer());

  const dir = mkdtempSync(join(tmpdir(), "polyskill-npm-"));
  try {
    writeFileSync(join(dir, "p.tgz"), buf);
    x({ sync: true, file: join(dir, "p.tgz"), cwd: dir });
    return JSON.parse(readFileSync(join(dir, "package", "skill.json"), "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
