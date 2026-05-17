# polyskill Project Wiki

## Terminal/exit paths must live OUTSIDE the registry-fetch try/catch in `install.ts`

<!-- added: 2026-05-17 -->

In `packages/cli/src/commands/install.ts`, a genuine registry 404 is a terminal
"not found" state — it must NOT fall through to the npm-mirror fallback. The
`process.exit(1)` for that case must be handled *after* the fetch try/catch
(via a `notFound` flag), never inside it.

**Why:** tests mock `process.exit` to *throw* `ExitError` (see `install.test.ts`).
If the 404 `process.exit(1)` sits inside the `try { fetch } catch`, that catch
swallows the thrown ExitError, sets `registryErr`, and execution wrongly
proceeds into the npm fallback — installing nothing or the wrong thing. In
production `process.exit` really exits so the bug is invisible there; only the
test exposes it. This bug shipped in the first implementation pass and was
caught by the "does NOT fall back to npm on registry 404" test.

**How to apply:** any terminal action (exit/return) whose trigger is evaluated
inside a try block must be deferred to after the try/catch when the catch is
scoped to a *different* failure (here: transport errors → npm fallback). Don't
co-locate "this is the end" with "this is recoverable."

## Spec-intended behavior change: registry 5xx / network error → npm fallback

<!-- added: 2026-05-17 -->

`install` deliberately falls back to the npm mirror on registry throw / 403 /
5xx (403 is the Claude-Code-web sandbox egress-block signal). Only a genuine
404 hard-fails. Two older tests ("on 500", "network failure") that asserted the
*old* hard-fail behavior were updated to assert the fallback — this is the
feature, not a regression. See `docs/superpowers/specs/2026-05-17-npm-skill-mirror-design.md`
in the `skill_marketplace` repo for the full design.
