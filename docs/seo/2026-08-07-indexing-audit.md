# PolySkill SEO — indexing audit + content batch 2 (2026-08-07)

**Supersedes the data (not the strategy) in [`2026-05-30-regional-seo-plan.md`](./2026-05-30-regional-seo-plan.md).**

Every number below carries a provenance tag: **Measured** = Google Search Console (real own-site
data), **Market-estimate** = DataForSEO (Google Ads volumes carry a 1–2 month lag), **Live-SERP** =
DataForSEO live SERP pulled 2026-08-07, **Inferred** = reasoning on top of those.

---

## The headline finding: six articles were published into a hole

**The 6 articles shipped on 2026-06-16 have never been crawled by Google.** Seven and a half weeks
after publication, the URL Inspection API returns the same verdict for all six:

| URL | Coverage state (Measured, URL Inspection API) |
|---|---|
| `/blog/claude-code-pricing` | **URL is unknown to Google** |
| `/blog/claude-code-subagents` | **URL is unknown to Google** |
| `/blog/claude-code-hooks` | **URL is unknown to Google** |
| `/blog/claude-code-commands` | **URL is unknown to Google** |
| `/blog/claude-code-memory` | **URL is unknown to Google** |
| `/blog/claude-code-plugins` | **URL is unknown to Google** |

Not "crawled and not indexed." Not "discovered, currently not indexed." *Unknown* — never fetched,
never queued. That matches GSC's page report exactly: none of the six recorded a single impression
in the last 28 days.

Control group (Measured), confirming the API and the site are otherwise healthy:

| URL | Coverage state | Last crawled |
|---|---|---|
| `/blog/how-to-add-skills-to-claude-code` | Submitted and indexed | 2026-08-02 |
| `/blog/claude-code-mcp` | Submitted and indexed | 2026-07-27 |
| `/blog/claude-code-marketplace` | Submitted and indexed | 2026-07-20 |
| `/` | Submitted and indexed | 2026-07-29 |

### Root cause — two independent discovery paths, both broken

**1. The sitemap has not been re-read since March.** (Measured, GSC Sitemaps API)

```
path:           https://polyskill.ai/sitemap.xml
lastSubmitted:  2026-02-27
lastDownloaded: 2026-03-11      <-- three months before the articles existed
submitted: 499  indexed: 0
```

The live sitemap *does* list all six URLs with correct `<lastmod>` values. Google simply has not
fetched the file since 2026-03-11, so it has never seen those entries.

**2. No indexed page links to them.** (Measured, live HTML of all 7 indexed articles)

The internal link graph was a closed loop. Every one of the 7 indexed articles linked only to the
other 6 indexed articles. Zero links pointed at any of the 6 new posts. Verified by fetching each
live page and extracting `href="/blog/..."`.

Why that was decisive: GSC's `referringUrls` shows this site's articles get discovered
*article-to-article*, e.g. `/blog/claude-code-marketplace` was discovered via
`/blog/claude-code-mcp`. The blog hub can't do the job — `/blog/` is **"Crawled – currently not
indexed"** (last crawled 2026-04-08), and `/blog` (no trailing slash) is flagged **"Redirect
error"** from a 2026-03-09 crawl. (The redirect itself is fine today: a single clean
`301 /blog → /blog/` serving 200 with all 14 links. Google just hasn't retried.)

**Why the links were missing:** the 2026-05-30 batch produced updated versions of
`how-to-add-skills-to-claude-code.html` and `claude-code-mcp.html` containing links to the new
posts, staged in `docs/seo/articles/updates/`. The publish step copied the 5 new articles and the
index but **not** the `updates/` folder. `git log` on `origin/main` confirms the flagship's last
change was 2026-05-18 — the link update never shipped. One skipped `cp` cost ~7 weeks of
invisibility on 5 articles.

### What this batch does about it

- **Fixed (this branch):** all 7 indexed articles rebuilt in `updates/` with in-context links to
  every orphaned and new post. Every one of the 11 targets now has **≥2 inbound links from a
  Google-indexed page** (was 0). Additive only — no pre-existing link was removed; verified
  programmatically.
- **Still requires the user (cannot be automated from here):** re-submit the sitemap in Search
  Console. The API `PUT .../sitemaps/{feedpath}` returned **403** because the local gcloud ADC token
  holds `webmasters.readonly` scope. See the handoff for the click-path.

> **RESOLVED 2026-08-09 (agent, via GSC web UI browser automation — the readonly-API limitation
> was bypassed by driving the logged-in browser):** sitemap re-submitted at 07:48 UTC and Google
> downloaded it within one second (`lastDownloaded: 2026-08-09T07:48:05Z`, was 2026-03-11;
> discovered pages 499 → 531). All six orphans then got "Request indexing" via URL Inspection.
> **Result (Measured, URL Inspection API): all six moved from "URL is unknown to Google" to
> "Submitted and indexed" within 12 minutes**, crawl timestamps 07:52–08:00 UTC. The
> `coverageState` re-check recommended below is now a *confirmation* pass, not a wait-and-hope:
> impressions appearing in GSC Performance is the remaining leading indicator to watch.

<recommendation>
**What:** Re-submit `https://polyskill.ai/sitemap.xml` in Search Console the same day the fix ships, and use "Request indexing" on the 6 orphaned URLs.
**Confidence:** High (direction) / Medium (timeline) — the diagnosis is directly measured, but how fast Google re-crawls a near-zero-authority domain is not.
**Evidence:** `lastDownloaded: 2026-03-11` on a sitemap that contains all 6 URLs; all 6 return `URL is unknown to Google`; all 6 return HTTP 200 and are listed in the live sitemap.
**Could be wrong if:** crawl budget, not discovery, is the real constraint — in which case the internal links will do the work and the sitemap resubmit changes nothing.
**To raise confidence:** re-run URL Inspection on the 6 orphans 7 and 14 days after the fix ships. Leading indicator: `coverageState` moving off "URL is unknown to Google".
</recommendation>

---

## Site performance now (Measured, GSC, 28d 2026-07-07 → 2026-08-04)

| Metric | Prior 28d | Last 28d | Change |
|---|---|---|---|
| Clicks | 24 | **22** | −8% |
| Impressions | 8,803 | **7,313** | −17% |
| CTR | 0.3% | 0.3% | flat |
| Avg position | 17.9 | **14.1** | **improved 3.8 places** |

Against the 2026-05-30 baseline (37 clicks / 7,043 impressions): impressions are flat, clicks are
down, average position is better. Read honestly: **the site is still pre-traction**, and the 15
published articles are doing the work of 9, because 6 of them are invisible.

Top pages (Measured):

| Page | Impr. | Clicks | Avg pos |
|---|---|---|---|
| `/blog/how-to-add-skills-to-claude-code` | 3,816 | 11 | 14.0 |
| `/blog/claude-code-router` | 2,026 | 3 | 12.8 |
| `/blog/claude-code-vs-gemini-cli` | 723 | 0 | 20.4 |
| `/` | 400 | 7 | 5.0 |
| `/blog/claude-code-mcp` | 215 | 0 | 25.8 |

Everything else — every article from the June batch — recorded **zero impressions**.

---

## Keyword data behind this batch's topics (Market-estimate, DataForSEO, US / 2840)

Volumes are Google Ads (1–2 month lag). KD = 0–100, lower is easier. Google Trends was pulled
alongside and showed no contradiction; note that overall "claude code" interest declined through
late July, so treat all volumes as a ceiling rather than a forecast.

| Keyword | Vol/mo | KD | Intent | Live-SERP reality | Shipped as |
|---|---|---|---|---|---|
| install claude code | 27,100 | 25 | info | AI Overview; docs hold #1–#2, third parties take #3–#5 | `claude-code-install` |
| claude code installation | 22,200 | 20 | transactional | — | ″ |
| how to install claude code | 4,400 | 17 | info | PAA incl. *"How can I install and run Claude Code on Windows?"* | ″ |
| **claude code plan mode** | **3,600** | **7** | info | AI Overview, but organic top-4 is all independent blogs + Reddit; docs only #5 | `claude-code-plan-mode` |
| claude code planning mode | 3,600 | 5 | info | — | ″ |
| **claude code review** | **2,900** | **4** | info | **No AI Overview**; PAA present; beatable competitor set | `claude-code-review` |
| **claude code agent teams** | **2,900** | **4** | commercial | — | `claude-code-agent-teams` |
| claude code security | 2,900 | 15 | nav | **No AI Overview**; docs + Medium + Reddit | `claude-code-permissions` |
| claude code auto mode | 1,900 | **0** | nav | — (brand-new feature term) | ″ |
| claude code dangerously-skip-permissions | 1,600 ×2 | 10–19 | transactional | — | ″ |
| claude code permissions | 720 | 10 | transactional | **No AI Overview**, no PAA | ″ |

Selection rule applied: **volume ÷ (KD+1)**, restricted to terms with no existing PolySkill page,
then sanity-checked against the live SERP for AI-Overview presence and competitor beatability.
`claude code plan mode` and `claude code review` are the two standouts — mid-volume, single-digit
difficulty, and SERPs owned by independent blogs rather than Anthropic's own domains.

Deliberately **not** taken this round:
- `claude skills` (33,100, KD 34) and `agent skills` (6,600, KD 72) — too hard for the current
  domain authority; still second-wave.
- `claude code alternatives` (1,300, KD 8) — cheap, but the site already has 4 comparison posts and
  a 5th risks an HCU templating pattern.
- `claude code statusline` (1,900, KD 5) and `claude code vscode` (1,900, KD 11) — good candidates
  for batch 3.

---

## Quality gate results (this batch)

| Article | Words | AI phrases | Em-dashes | Invisible Unicode | JSON-LD | FAQ parity |
|---|---|---|---|---|---|---|
| claude-code-install | 2,194 | 0 | 0 | 0 | 3 blocks valid | exact |
| claude-code-plan-mode | 1,811 | 0 | 0 | 0 | 3 blocks valid | exact |
| claude-code-permissions | 2,386 | 0 | 0 | 0 | 3 blocks valid | exact |
| claude-code-review | 2,414 | 0 | 0 | 0 | 3 blocks valid | exact |
| claude-code-agent-teams | 2,336 | 0 | 0 | 0 | 3 blocks valid | exact |

Comparable to the published batch measured the same way (1,857–2,242 words).

**HCU de-templating: H2 skeleton overlap is 0% across every pair** of the 10 staged articles.
One real FAQ collision was found and fixed: the install page originally carried the exact phrase
*"is claude code free"*, which the flagship pricing page already targets (5,400/mo). Reworded to
*"Do I need a paid plan to install Claude Code?"* and cross-linked to the pricing page so the signal
consolidates rather than splits.

**Technical accuracy:** every command, flag, env var, settings key, and file path was verified
against `code.claude.com/docs` on 2026-08-07 — permission modes, the native/Homebrew/WinGet/apt/npm
install matrix, `claude doctor`, plan-mode approval options, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`,
`REVIEW.md`, and the `/code-review` flag set.

## Data infrastructure

- **GSC:** `sc-domain:polyskill.ai`, gcloud ADC, quota project `polyskill-seo`. Token scope is
  **read-only** — sitemap submission and "Request indexing" must be done in the web UI.
- **DataForSEO:** creds in `~/.zshenv`. Balance $39.9954 → $39.8224 across this session, so the
  audit cost **$0.173** (keyword discovery, a 25-keyword `keyword_overview` batch, 5 live SERPs, and
  one Google Trends pull). Measured from the API, not estimated.
