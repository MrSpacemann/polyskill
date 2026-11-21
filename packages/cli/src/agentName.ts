import { randomBytes } from "node:crypto";
import { hostname } from "node:os";

/** The registry's agent-name rule (GitHub username rules): 2-39 chars. */
export const AGENT_NAME_RE = /^(?!.*--)[a-z0-9][a-z0-9-]{0,37}[a-z0-9]$/;

/**
 * A name for a key made on this computer: `<prefix>-<computer>-<4 hex>`, e.g.
 * `cli-frederiks-macbook-air-3f2a`. Always matches AGENT_NAME_RE; falls back
 * to `<prefix>-<8 hex>` when the computer name has nothing usable.
 */
export function generateAgentName(
  prefix = "cli",
  host: string = hostname(),
  suffix: string = randomBytes(2).toString("hex"),
): string {
  const room = 39 - prefix.length - suffix.length - 2;
  const slug = host
    .toLowerCase()
    .split(".")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, room)
    .replace(/-+$/g, "");
  const name = slug ? `${prefix}-${slug}-${suffix}` : `${prefix}-${randomBytes(4).toString("hex")}`;
  return AGENT_NAME_RE.test(name) ? name : `${prefix}-${randomBytes(4).toString("hex")}`;
}
