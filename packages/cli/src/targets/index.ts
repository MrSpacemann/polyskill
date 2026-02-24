import { existsSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import { claudeCodeTarget } from "./claude-code.js";
import { openclawTarget } from "./openclaw.js";
import { opencodeTarget, openCodeRootDir } from "./opencode.js";
import { codexTarget, codexRootDir } from "./codex.js";
import { localTarget } from "./local.js";

export interface Target {
  name: string;
  dir: string;
  write(skill: any, outputDir: string): Promise<void>;
}

export const targetRegistry: Record<string, Target> = {
  "claude-code": claudeCodeTarget,
  openclaw: openclawTarget,
  opencode: opencodeTarget,
  codex: codexTarget,
  local: localTarget,
};

/** Root directories to probe for each runtime target. */
const runtimeRoots: Record<string, string> = {
  "claude-code": join(os.homedir(), ".claude"),
  openclaw: join(os.homedir(), ".openclaw"),
  opencode: openCodeRootDir(),
  codex: codexRootDir(),
};

/** Returns the names of runtime targets whose root directories exist on disk. */
export function detectInstalledTargets(): string[] {
  return Object.entries(runtimeRoots)
    .filter(([, dir]) => existsSync(dir))
    .map(([name]) => name);
}

/**
 * Resolves which target to use.
 *
 * Priority:
 *   1. Explicit --target flag
 *   2. --output given (implies local, backward compat)
 *   3. Auto-detect from installed runtimes
 *      - 1 found  → use it, print confirmation
 *      - >1 found → print list, exit with message to re-run with --target
 *      - 0 found  → fall back to local with a warning
 */
export function resolveTarget(
  flag: string | undefined,
  hasOutputFlag: boolean
): Target {
  if (flag) {
    const target = targetRegistry[flag];
    if (!target) {
      console.log(
        chalk.red(
          `\nUnknown target: "${flag}". Valid targets: ${Object.keys(targetRegistry).join(", ")}`
        )
      );
      process.exit(1);
    }
    return target;
  }

  if (hasOutputFlag) {
    return localTarget;
  }

  // Auto-detect
  const found = detectInstalledTargets();

  if (found.length === 1) {
    console.log(chalk.dim(`  Auto-detected runtime: ${found[0]}`));
    return targetRegistry[found[0]];
  }

  if (found.length > 1) {
    console.log(
      chalk.yellow(
        `\nMultiple runtimes detected: ${found.join(", ")}.\nRe-run with --target <runtime> to choose one.\n`
      )
    );
    process.exit(1);
  }

  // None found
  console.log(
    chalk.yellow(
      "  No runtime detected — installing to ./skills/ (use --target to override)"
    )
  );
  return localTarget;
}
