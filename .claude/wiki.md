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

## SEO data access: GSC property + the website blog live OUTSIDE this repo

<!-- added: 2026-05-30 -->

Real organic-search data for polyskill.ai comes from **Google Search Console**,
property **`sc-domain:polyskill.ai`**, accessed via gcloud Application Default
Credentials (token: `gcloud auth application-default print-access-token`), quota
project **`polyskill-seo`**. Every GSC curl needs
`-H "x-goog-user-project: polyskill-seo"` or Google rejects it. The
`mrspacemann-seo-beast` skill has the full query reference.

**Why this matters / landmine:** this repo (`@polyskill/cli` + `@polyskill/core`)
contains **no website/blog content** — the polyskill.ai marketing site, blog
posts (`/blog/*`), and on-page SEO live in a *separate* repo/deployment (the
`skill_marketplace` project per other wiki entries). So SEO/GEO work is
**research-and-recommend** here, not code edits.
First regional SEO plan: `docs/seo/2026-05-30-regional-seo-plan.md` (v2).

**DataForSEO is now configured** (2026-05-30): creds in **`~/.zshenv`**
(`DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`), copied from
`skill_marketplace/.env`. **All APIs enabled** (Labs, Backlinks, Google Ads,
SERP); balance ~$40. Two landmines hit while setting up:
1. **Put env exports in `~/.zshenv`, NOT `~/.zshrc`.** Claude Code's Bash tool
   runs a *non-interactive* zsh, which sources `~/.zshenv` only — `~/.zshrc` is
   interactive-only, so creds added there are invisible to the agent's shell.
2. **The `live: N` numbers in `appendix/user_data` rate-limits are NOT access
   indicators.** Many showed `live: 0` yet the endpoints work fine. Don't infer
   "API not enabled" from them — test the endpoint. (A `40100 Unauthorized` on a
   data endpoint while `user_data` succeeds = almost always *empty/!malformed
   creds being sent*, e.g. a grep that didn't match the `export ` prefix.)

**Key SEO finding:** polyskill.ai is a near-zero-authority new domain (no
indexed backlinks/organic footprint in DataForSEO) — strategy must favor
low-KD keywords. Real US volumes reordered the plan: the prizes are
`claude code skills` (9,900/KD32), `claude code plugins` (4,400/KD12),
`claude code pricing` (27,100/KD13 but AI-Overview-capped) — NOT the
"add skill to claude code" long-tail (~30/mo) that GSC impressions over-weighted.

## Blog = static HTML in skill_marketplace; template + publish conventions

<!-- added: 2026-05-30 -->

The polyskill.ai blog is hand-authored **static HTML** files in
`skill_marketplace/packages/server/public/blog/<slug>.html` (NOT markdown, NO
build step generates them). Conventions every post follows (copy an existing
post as the template):
- `<head>`: GTM, full meta+OG+Twitter, canonical `https://polyskill.ai/blog/<slug>`,
  and **three JSON-LD blocks** — `Article`, `BreadcrumbList`, `FAQPage` (the
  FAQPage `name`s MUST match the visible `<h3>` FAQ questions verbatim).
- OG/hero image at `/img/og/<slug>.jpg` (1200×669) **plus** `-600w.jpg` and
  `-1000w.jpg` responsive variants, referenced via `srcset` on the hero `<img>`.
  Files live in `packages/server/public/img/og/`.
- Body: `<header class="site-header">` nav + `<footer class="site-footer">` are
  identical across posts; article inside `<main class="container docs-main"><article class="blog-article">`.
- **House style quirk:** list items are `<li><strong>Label</strong>:text</li>`
  with **no space after the colon** — intentional/consistent across all posts
  (`.blog-article-body strong{display:inline-block}` handles spacing). Do NOT
  "fix" it per-post; it would desync from the other posts.
- New posts must be added as cards to `blog/index.html` (match existing card markup).

Publishing = copy files into skill_marketplace + deploy (Railway); the agent
stages drafts in `polyskill/docs/seo/articles/` (see that folder's
`_HANDOFF_HOW_TO_PUBLISH.md`). **Always `git pull` skill_marketplace first** —
the local clone is often many commits behind origin/main, and the live blog has
more posts than a stale clone shows.

**Doc-drift landmine (verified 2026-05-30):** Claude Code **custom slash-command
argument indexing is 0-based** (`$0` = first arg, `$1` = second), and bash
injection is **backtick-wrapped** `` !`cmd` `` (not bare `!cmd`). Also "custom
commands have been merged into skills" (`.claude/commands/*.md` still works).
Source: https://code.claude.com/docs/en/slash-commands. A draft got all three
wrong; the analyzer caught it. Verify against that page before writing about
command syntax.
