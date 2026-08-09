# polyskill Project Wiki

## Core JSON schemas are ALSO the server's validator — loosen client-first only

<!-- added: 2026-07-03 -->

The registry server (private `skill_marketplace` repo) validates publishes with the same
`@polyskill/core` schemas. Changing a schema here therefore needs a lockstep server upgrade
(publish core → bump the server's dependency, per CONTRIBUTING). Safe order: LOOSENING
(accepting more) ships client-first — worst case the old server rejects the new shape with a
clear 400 at publish. TIGHTENING must ship server-first or freshly-valid local skills would
already be live that the server later can't re-validate. 2026-07-03: `parameters` gained
boolean `additionalProperties` (OpenAI strict mode) — a loosening; server catches up on its
next core bump.

## CLI version comes from package.json at runtime — never hardcode it

<!-- added: 2026-07-02 -->

`packages/cli/src/index.ts` reads its version via `createRequire(import.meta.url)("../package.json")`.
Do not reintroduce a hardcoded `.version("x.y.z")` string.

**Why:** the old hardcoded string drifted in production — npm's `@polyskill/cli@0.1.13`
reports `0.1.12` from `--version` because the publish bumped only package.json.
CONTRIBUTING's "bump in two places" step didn't prevent it; a single source of truth does.

## getting-started skill: repo is canonical, but published version can run AHEAD of repo

<!-- added: 2026-07-02 -->

The registry's published `@polyskill/getting-started` was 1.0.8 while the repo said 1.0.7 —
and the published 1.0.8 content was STALE (taught `--sort downloads`, which the live API
rejects: "Must be one of: relevance, name, recent"; removed from the repo in commit 9110cd6).
Repo bumped to 1.0.9 on 2026-07-02 so the corrected content is publishable again; it still
needs an authenticated `polyskill publish skills/getting-started` to go live.

**Why:** publishing without committing the version bump (or vice versa) forks the two copies,
and the registry rejects re-publishing at or below the published version — so a stale published
skill silently becomes unfixable until someone notices and bumps past it. After any publish of
this skill, verify `curl -s https://polyskill.ai/api/skills/%40polyskill%2Fgetting-started | jq .version`
matches `skills/getting-started/skill.json`.

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

## Publishing the blog: the `updates/` folder is load-bearing
<!-- added: 2026-08-07 -->
A staged batch in `docs/seo/articles/` has three parts that must ALL be copied:
the new `*.html`, the images, **and `updates/*.html`** (rebuilt existing posts +
`index.html`). On 2026-06-16 only the first two shipped. Result: 6 articles with
zero inbound links from any indexed page, and **7 weeks later Google had still
never crawled them** (`URL is unknown to Google` on all six, verified via the GSC
URL Inspection API 2026-08-07).
**Why:** on this domain, discovery happens article-to-article — GSC `referringUrls`
shows e.g. `/blog/claude-code-marketplace` was found via `/blog/claude-code-mcp`.
The blog hub can't carry it: `/blog/` is "Crawled – currently not indexed" and the
sitemap was last downloaded by Google on **2026-03-11**. A new post with no inbound
link from an indexed page is invisible no matter how good it is.
**Rule:** after publishing, every new slug must have ≥2 inbound links from an
already-indexed post, and the sitemap must be re-submitted in Search Console by
hand (the gcloud ADC token is `webmasters.readonly`; `PUT .../sitemaps/{feed}`
returns 403). Verification snippet is in `docs/seo/articles/_HANDOFF_HOW_TO_PUBLISH.md`.

## "Published" ≠ "indexed" — check coverage, not just deploy
<!-- added: 2026-08-07 -->
GSC's per-page impressions report **silently omits** pages Google has never
crawled — they don't show as zero, they just aren't rows. So a batch can look
"fine, just early" when it is actually invisible. The only definitive check is the
URL Inspection API `indexStatusResult.coverageState`.
**Why:** "URL is unknown to Google" (never fetched) reads very differently from
"Crawled – currently not indexed" (fetched, judged not worth indexing) and the
fixes are opposite — the first needs discovery (links/sitemap), the second needs
content quality or authority. Diagnosing from impressions alone can't tell them apart.

## Blog article word counts: measure prose, not raw HTML
<!-- added: 2026-08-07 -->
`docs/seo/articles/published-2026-06-16/_PROGRESS.md` claims the June articles are
"2.7–3.5k words". Stripping tags puts them at **1,857–2,242**. The larger figure
counted raw HTML tokens.
**Why:** it matters when judging whether a new draft is thin. Compare like for
like — strip tags from the `<div class="blog-article-body">` block before counting,
or a perfectly normal 2,200-word post looks 40% short of a phantom target.

## seo-beast skill source lives in ~/claude-dotfiles, NOT the quarantine copy
<!-- added: 2026-08-09 -->
The editable source of `@mrspacemann/seo-beast` is
`~/claude-dotfiles/skills/mrspacemann-seo-beast/` (its own git repo,
MrSpacemann/claude-dotfiles). `~/.claude/skills-quarantine/mrspacemann-seo-beast/`
is an installed copy that lags versions. Ship flow: edit SKILL.md → bump
`skill.json` with sed (a python json rewrite explodes the compact arrays into a
noisy diff) → `polyskill validate .` → `polyskill build .` (dist/*.json embed the
full SKILL.md, so they MUST be rebuilt) → `polyskill publish` → commit+push.
**Why:** editing the quarantine copy silently does nothing, and skipping build
ships adapters carrying the previous version's instructions.

## Awesome-list link building: intake rules differ per list and are enforced
<!-- added: 2026-08-09 -->
hesreallyhim/awesome-claude-code (52k★) takes recommendations ONLY via its web-UI
issue form (bot-validated; eligibility: 14 days active dev OR 100★; one resource
per submission). ComposioHQ/awesome-claude-skills (72k★) accepts actual skill
folders only — tool-link PRs are auto-rejects. travisvn/karanb192/jqueryscript
take normal README PRs. 2026-08-09 submissions: PRs #1096/#193/#578 + issue #2472
(details in docs/seo/outreach/2026-08-09-link-acquisition-field-run.md).
**Why:** the wrong intake path wastes the one shot a small project gets with a
maintainer, and a future agent will otherwise re-derive all of this from scratch.

## `polyskill publish` of large skills: client + edge timeouts fire, but the publish often SUCCEEDS
<!-- added: 2026-08-09 -->
Publishing seo-beast 1.9.0 (~500KB body: instructions + 5 embedded adapters):
CLI aborts at 30s (`publish.ts` AbortSignal), and even a direct curl dies at
~62s with HTTP 000 (edge proxy kill) — yet the registry finished processing
server-side and the version went live. **After any publish timeout, check
`polyskill search <name>` (and diff a content marker via
`/api/skills/%40scope%2Fname` — the @/% must be URL-encoded, the raw path 404s)
BEFORE retrying.** Blind retries race whichever attempt the server finishes
first, and you can't tell which payload won without checking content.
**Why:** the synchronous publish path (validate+scan) outlives both timeouts for
big skills; the visible failure is a lie. Real fix candidate: async publish
(202 + status polling) — not implemented as of 2026-08-09.

## GSC request-indexing quota is exactly 10/day; sitemap resubmit dedupes same-day
<!-- added: 2026-08-09 -->
Measured on sc-domain:polyskill.ai: the 11th URL-Inspection "Request Indexing"
of the day returns "Quota exceeded — try again tomorrow"; re-submitting the same
sitemap URL a second time the same day is a silent no-op (lastSubmitted
unmoved, no error, no toast). Both requests worked spectacularly when they
counted: all 6 June orphans + 4 of 5 batch-2 articles went "Submitted and
indexed" within ~12 minutes of request (2026-08-09).
**Why:** budget the 10 requests before starting a batch (highest-value URLs
first) and make the day's single sitemap submission AFTER the day's last deploy
— burning it early wastes it.
