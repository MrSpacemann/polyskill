# SEO content sprint — progress (2026-05-30)

**Goal (user /goal):** ≥5 new blog articles + updates to existing posts + images, all quality-looped until an independent analyzer confirms high quality.

## Context
- Blog lives in `skill_marketplace/packages/server/public/blog/*.html` (static HTML). Local clone is **14 commits behind origin/main** — do NOT write into it; templates pulled from `origin/main` via `git show` (cached at /tmp/tpl-*.html).
- Deliverables staged HERE: `docs/seo/articles/` (publish-ready HTML) + `docs/seo/articles/img/og/` (images). User copies into skill_marketplace after `git pull`.
- Data: GSC (sc-domain:polyskill.ai) + DataForSEO (configured, ~$40.7). Plan: `docs/seo/2026-05-30-regional-seo-plan.md`.
- Existing posts (do NOT duplicate): how-to-add-skills, claude-code-mcp, claude-code-plugins, claude-code-marketplace, claude-code-router, claude-code-vs-cursor, claude-code-vs-gemini-cli, codex-vs-claude-code.

## 5 new articles (gaps, real US volume / KD)
1. claude-code-pricing — 27,100 / KD13 / commercial
2. claude-code-subagents — 2,900 (+"agents" 2,900) / KD18 / info
3. claude-code-hooks — 2,900 / KD19 / nav
4. claude-code-commands — 1,900 (+slash/custom) / KD9 / info
5. claude-code-memory — 1,000 / KD3 / info

## Updates
- how-to-add-skills (flagship, "claude code skills" 9,900, pos 11.8) — refresh + internal links to new 5
- claude-code-mcp (pos 41) — refresh + internal links
- blog index.html — add 5 new posts

## Status — COMPLETE
- [x] Template + framework extracted
- [x] Authoring brief written (_BRIEF.md)
- [x] 5 articles drafted (parallel writer subagents)
- [x] Analyzer loop pass — pricing 91, subagents 89, hooks 91, commands ~88 (fixed), memory 88; all ≥85 composite / ≥82 citability; HCU de-templated; AI-scrubbed; tech-accuracy verified vs official docs
- [x] 5 OG images (1200×669 + -600w/-1000w = 15 files in img/og/)
- [x] 2 updates (flagship how-to-add-skills + claude-code-mcp) in updates/
- [x] index.html updated (5 new cards) in updates/
- [x] Handoff written (_HANDOFF_HOW_TO_PUBLISH.md)

Publish = copy updates/ + 5 new .html into skill_marketplace blog + img/og into public/img/og (see handoff). NOT yet deployed (user controls publishing).
