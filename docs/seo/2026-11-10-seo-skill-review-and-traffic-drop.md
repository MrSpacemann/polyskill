# SEO skill review + polyskill.ai traffic drop — 2026-11-10

Trigger: a viral "ridiculously simple SEO trick" list of 21 "high-DR" profile sites (chromewebstore,
taplink, behance, dribbble, producthunt, crunchbase, dev.to, indiepa.ge, carrd, linktr.ee, mssg.me,
climate.stripe, medium, hashnode, substack, pages.github, gumroad, viralmarketinglab, TrustMRR,
G2/Capterra, about.me) and the question "should the SEO skill (seo-beast) use it?".
Everything below was measured on 2026-11-10 unless marked otherwise. Tags follow seo-beast Rule 17:
**Measured**, **Inferred**, **Relayed** (from a source I quote but did not re-derive).

## 1. The list: not as a tactic — the skill already had it as Tier 4, and measuring it makes it weaker

The DR in the list is the platform's domain authority. The link you get sits on a new profile page
that nothing links to, usually marked `nofollow`/`ugc`. Measured on real public pages of each
platform (raw HTML via a script; Chrome rendered DOM for bot-walled or JavaScript-only pages):

| Result | Platforms |
|---|---|
| Followed (9) | linktr.ee, indiepa.ge, dev.to profile link, carrd (own subdomain), GitHub Pages (own subdomain, by construction), Substack post body, viralmarketinglab, mssg.me (JS-only), Gumroad (JS-only) |
| Mixed (1) | TrustMRR (one listing nofollow, one followed; needs Stripe-verified revenue) |
| nofollow / ugc (10) | Product Hunt (`ugc`), Behance (`ugc`), Chrome Web Store (`ugc nofollow`), Stripe Climate (`ugc nofollow`), Medium articles (`ugc nofollow`), Hashnode (`nofollow ugc`), Crunchbase, about.me, Dribbble, Taplink (`nofollow`) |
| No link (1) | G2 / Capterra (no `<a>` to the vendor in the rendered product page) |

- **dev.to trap (Measured):** 24 of 24 brand-new posts sampled from `/api/articles/latest` were served
  `<meta name="robots" content="noindex">` + `nofollow`. Forem's source (`Article#skip_indexing?`)
  noindexes a post until its score reaches `index_minimum_score` (quality reactions from trusted
  users) or it is featured. A fresh cross-post passes nothing at first.
- **polyskill.ai is already on Product Hunt** (7 linking pages in Search Console).
- **What actually correlates with AI visibility is brand mentions, not links (Relayed, primary
  source re-read):** Ahrefs 2025-12-12, 75K brands: YouTube mentions ~0.737, branded web mentions
  0.66–0.71, branded anchors 0.51–0.63, Domain Rating 0.27–0.33, backlinks "very weak".

Verdict: worth one batch only for platforms with a real audience for this product (Product Hunt,
Crunchbase, G2 — brand-mention value), not for the DR numbers. The skill's Tier 4 now carries the
measured table and the "host DR is the wrong number" rule.

## 2. Bigger finding: polyskill.ai lost ~90% of its non-brand search visibility (Sep → Nov)

**Measured (GSC API, sc-domain:polyskill.ai):**
- Daily impressions ≈ 800 (Sep 1–2) → ≈ 60–90 (late Oct – Nov 8). Average position ~7 → 15–25.
  Steps around Sep 16–18, Oct 1 and Oct 19–23.
- Monthly clicks still rose (Aug 42 → Sep 159 → Oct 239) because of brand spikes (Sep 28–30,
  Oct 9–11): the query "polyskill" alone has 243 clicks in 3 months. Watching clicks hid the loss.
- Concentrated: `/blog/how-to-add-skills-to-claude-code` 5,404 → 419 impressions (pos 7.2 → 22.3),
  `/blog/claude-code-router` pos 8.7 → 33.5; dozens of `/skill/*` pages went to 0.
- That article's queries: "how to install skills in claude code" pos 1.7 → 38; "add skills to
  claude code" 3.1 → not ranking; "how to add skills to claude code" 9.1 → 54.3.
- Both big articles are still "Submitted and indexed" (URL Inspection) → demoted/outranked, not removed.
- Search Console's Generative AI report: ~230 AI-feature impressions/day late Aug → ~5/day now;
  3,141 of 4,540 (3 months) came from that one article.
- Live US SERP for "how to add skills to claude code" (logged-out style query): 4 of the top 6 are
  Anthropic's own pages (code.claude.com docs, support.claude.com, a resources.anthropic.com guide
  PDF, academy.claude.com course), plus Reddit, a Substack post and chrislema.com.
- Index coverage: blog 15 of 19 articles indexed; `claude-code-mcp`, `-pricing`, `-subagents`,
  `fable-5-mythos-5-banned` are "Crawled – currently not indexed"; the hub `/blog/` is
  "URL is unknown to Google" although it is in the sitemap and 200s with a correct canonical.
- Sitemap: 539 URLs, of which 515 are `/skill/*` (auto-imported listings; a sampled page has
  ~170 visible words, mostly the listed repo's own CLAUDE.md). URL Inspection sample of 39:
  10 indexed, 21 crawled-not-indexed, 2 discovered-not-indexed, 6 unknown → **74% not indexed**.
- Search Console Links: 128 external links from 12 sites, **all to the homepage**; no article has
  an external link Google knows of.
- Google's data-anomalies page lists no Search-impressions issue for Sep–Nov 2026 → not a
  reporting glitch (Relayed from support.google.com/webmasters/answer/6211453, re-read).
- Google Search Status Dashboard: no core update after May 2026; the September 2026 spam update ran
  Sep 24 for 13 days 16 hours, i.e. to ~Oct 8 (overlaps only the Oct 1 step) (Relayed, re-read on
  status.search.google.com 2026-11-10).

**Inferred causes (not proven):**
1. **Outranked by the official source.** Anthropic now covers "how to install skills" with docs, a
   help-center article, a guide and a course. A third-party how-to rarely beats the vendor once it
   exists. Fits: the page is still indexed, its head queries fell 1.7 → 38.
2. **Site-wide quality drag from the thin `/skill/*` template.** 96% of sitemap URLs, ~74% of them
   rejected by Google. This is the scaled-content pattern Google's site-wide quality signals weigh.
   Would be disproved if noindexing the template leaves the good pages unchanged after 4–8 weeks.
3. **No external links to any article** — nothing outside the site vouches for the content pages.

## 3. Recommendations for the site (skill_marketplace — not changed here)

<recommendation>
**What:** Noindex the `/skill/*` pages that are thin auto-imports (or drop them from the sitemap) and keep indexable only listings with real unique content; then watch the blog's non-brand impressions for 4–8 weeks.
**Confidence:** Medium on direction (the pattern is measured: 515/539 URLs, ~74% of a sample rejected); Low on how much it recovers (the site-wide drag is inferred, not measured).
**Evidence:** sitemap count; 39-URL URL Inspection sample; ~170-word sample page.
**Could be wrong if:** the drop is purely competitive (cause 1) — then the good pages won't move.
**To raise confidence:** run it as the experiment above; compare non-brand impressions of the 15 indexed articles before/after.
</recommendation>

<recommendation>
**What:** Re-angle `/blog/how-to-add-skills-to-claude-code` toward what Anthropic's docs don't cover (installing skills across tools/agents, finding and vetting third-party skills, troubleshooting), instead of competing on the generic how-to.
**Confidence:** Medium.
**Evidence:** SERP measured today (4 of top 6 are Anthropic); the article's head-query positions fell 1.7 → 38 while it stayed indexed.
**Could be wrong if:** Google's ranking of the official pages is temporary (unconfirmed volatility).
**To raise confidence:** check the same SERP again in 2 weeks; GSC queries for the new angle after the rewrite.
</recommendation>

<recommendation>
**What:** Request indexing for `https://polyskill.ai/blog/` in Search Console (1 of the 10 daily requests) — it is in the sitemap but unknown to Google.
**Confidence:** High that the request is cheap and correct; Low on ranking impact.
**Evidence:** URL Inspection "URL is unknown to Google", 200 + correct canonical.
**Could be wrong if:** Google re-classifies it as crawled-not-indexed (then it is a quality/thin-hub problem).
**To raise confidence:** re-inspect 15 minutes and 7 days after the request.
</recommendation>

<recommendation>
**What:** Put link-building effort into earning links and mentions for the articles (YouTube, Reddit, one useful article cited by others), not into the 21-site profile list.
**Confidence:** Medium on direction, Low on size of effect.
**Evidence:** GSC Links — all 128 links hit the homepage; Ahrefs correlations favour mentions over links.
**Could be wrong if:** the bottleneck is causes 1–2 above, which links don't fix.
**To raise confidence:** after any batch, re-read GSC Links "Top linked pages".
</recommendation>

## 4. Skill changes (seo-beast 1.11.0, ~/claude-dotfiles)

See its CHANGELOG. Main ones: removed correlation numbers the cited study never published
(Reddit ~0.65 etc.); rewrote the AI-crawler table from the vendors' docs (GPTBot/ClaudeBot/
Google-Extended are training-only — blocking them costs no search visibility); FAQ rich results
retired 2026-05-07; DataForSEO LLM Mentions endpoint + 2026-07 price rise; new Traffic-Drop Triage
section built from section 2; measured Tier-4 table; GSC Links + Generative AI report as free checks.

## 5. Not done / not verified

- DataForSEO backlink re-measure vs the 2026-08-09 baseline (rank 120, 25 backlinks, 6 referring
  domains): skipped — paid call, not opted in this session. GSC Links (free) used instead.
- Awesome-list follow-up: karanb192 #193 merged 2026-10-02; travisvn #1096, jqueryscript #578 and
  hesreallyhim issue #2472 still open with no maintainer response.
- The cause split in section 2 is inferred; only an experiment separates causes 1 and 2.
