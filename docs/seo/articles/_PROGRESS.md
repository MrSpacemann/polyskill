# SEO content batch 2 — progress (2026-08-07)

**Task:** use the SEO skill, produce more content for polyskill based on what the data says makes
sense, and make images.

**Status: COMPLETE and staged. Not yet published — publishing is a user action (see
`_HANDOFF_HOW_TO_PUBLISH.md`).**

## What happened

Topic selection started from real data rather than a guess: GSC for own-site performance,
DataForSEO for volumes/difficulty, live SERP checks for competitor beatability, Google Trends for
freshness. That audit surfaced something bigger than the content brief —

**The 6 articles published 2026-06-16 have never been crawled by Google.** All six return
`URL is unknown to Google`. Root cause: no indexed page linked to them (the previous batch's
`updates/` folder was never published), and Google hasn't re-downloaded the sitemap since
2026-03-11. Full diagnosis: [`../2026-08-07-indexing-audit.md`](../2026-08-07-indexing-audit.md).

So this batch ships the content that was asked for **plus** the fix that makes any of it countable.

## Deliverables

- [x] Real-data topic selection — GSC 28d, DataForSEO volumes/KD for 45 keywords, live SERPs for 5
      candidates, Google Trends cross-check ($0.173 of DataForSEO credit, measured)
- [x] **5 new articles**, publish-ready HTML matching the live template byte-for-byte:
      `claude-code-install` (install cluster, 27,100+22,200+4,400/mo),
      `claude-code-plan-mode` (3,600/mo, KD 7),
      `claude-code-permissions` (security 2,900 + auto-mode 1,900 + skip-permissions 3,200),
      `claude-code-review` (2,900/mo, KD 4, no AI Overview),
      `claude-code-agent-teams` (2,900/mo, KD 4)
- [x] **15 images** — hero/OG per article at 1200×669 plus `-600w`/`-1000w`, matching the existing
      dark-navy / gold-and-cyan 3D house style
- [x] **Indexing fix** — all 7 Google-indexed articles rebuilt in `updates/` with in-context links
      to every orphaned and new post. Each of the 11 targets went from **0 → ≥2** inbound links
      from an indexed page. Additive only; no existing link removed (verified programmatically).
- [x] Blog `index.html` rebuilt with 5 new cards (14 → 19)
- [x] Quality gate: 0 banned AI phrases, 0 em-dashes in body, 0 invisible Unicode, 3 valid JSON-LD
      blocks per article, FAQ JSON-LD exactly matching visible `<h3>`s, all internal links resolve
- [x] HCU de-templating: **0% H2-skeleton overlap** across all 10 staged articles; one real FAQ
      keyword collision with the pricing page found and fixed
- [x] Technical accuracy verified against `code.claude.com/docs` on 2026-08-07
- [x] Publish simulated end-to-end into a scratch copy of the live blog; the handoff's verification
      commands were run against it and pass
- [x] June batch archived to `published-2026-06-16/` so pending work can't be confused with shipped
      work again

## Open threads for the next session

1. **The two Search Console actions in the handoff are the highest-leverage work left** and can't be
   done from the CLI (local gcloud token is read-only, `PUT sitemaps` returns 403).
2. **Verify the fix landed:** re-run URL Inspection on the 6 orphans ~7 and ~14 days after publish.
   If `coverageState` is still "URL is unknown to Google", discovery isn't the constraint — crawl
   budget is, and the lever becomes external links, not more articles.
3. **Batch 3 candidates**, already researched and rejected only on scope this round:
   `claude code statusline` (1,900, KD 5), `claude code vscode` (1,900, KD 11),
   `claude code alternatives` (1,300, KD 8 — check HCU risk against the 4 existing comparisons).
4. **`/blog/` hub is "Crawled – currently not indexed"** (last crawled 2026-04-08) and `/blog` is
   flagged "Redirect error" from 2026-03-09. The redirect is clean today. Worth a Request Indexing
   on `/blog/` too, and worth watching whether it ever gets indexed.
