import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const TOKEN_DIR = join(homedir(), ".polyskill");
const TOKEN_PATH = join(TOKEN_DIR, "token");

/** Returns auth token from env var or file, or null if not logged in */
export function getToken(): string | null {
  if (process.env.POLYSKILL_TOKEN) {
    return process.env.POLYSKILL_TOKEN;
  }
  try {
    return readFileSync(TOKEN_PATH, "utf-8").trim();
  } catch {
    return null;
  }
}

/** Saves token to ~/.polyskill/token (mode 600, dir mode 700) */
export function setToken(token: string): void {
  mkdirSync(TOKEN_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(TOKEN_PATH, token + "\n", { mode: 0o600 });
}

/** Removes stored token */
export function clearToken(): void {
  try {
    unlinkSync(TOKEN_PATH);
  } catch {
    // File doesn't exist — that's fine
  }
}
