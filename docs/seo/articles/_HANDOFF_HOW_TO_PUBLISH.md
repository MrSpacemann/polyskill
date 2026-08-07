# How to publish this batch (2026-08-07)

> ⚠️ **Read this first.** The last batch (2026-06-16) was published by copying the new articles and
> the index but **skipping the `updates/` folder**. That single omission left 6 articles with zero
> inbound links from any indexed page, and Google has never crawled them — 7 weeks of nothing. See
> [`../2026-08-07-indexing-audit.md`](../2026-08-07-indexing-audit.md) for the full diagnosis.
> **`updates/` is not optional. It is the most important folder here.**

The blog is served as static files from the **skill_marketplace** repo at
`packages/server/public/`. Everything here is publish-ready and matches the live template exactly.

## What's in this folder

| Path | What it is | Must be copied? |
|---|---|---|
| `*.html` (5 files) | The new articles | **Yes** |
| `updates/*.html` (8 files) | 7 rebuilt existing articles + the blog index | **Yes — this is the indexing fix** |
| `img/og/*.jpg` (15 files) | Hero/OG images, 1200×669 + 600w/1000w variants | **Yes** |
| `published-2026-06-16/` | Already live. Archived so it can't be confused with pending work | No — ignore |

The 5 new articles: `claude-code-install`, `claude-code-plan-mode`, `claude-code-permissions`,
`claude-code-review`, `claude-code-agent-teams`.

## Publish steps

**1. Get skill_marketplace up to date.**

```
cd ~/Developer/GitHub/skill_marketplace
git pull
```

**2. Copy everything. All three lines — do not skip the second one.**

```
STAGE=~/Developer/GitHub/polyskill/.worktrees/111a1f48-19b4-4d59-84e2-aed01f74848f/docs/seo/articles
DEST=~/Developer/GitHub/skill_marketplace/packages/server/public

cp "$STAGE"/*.html                "$DEST"/blog/          # 5 new articles
cp "$STAGE"/updates/*.html        "$DEST"/blog/          # 7 rebuilt articles + index  <-- THE FIX
cp "$STAGE"/img/og/*.jpg          "$DEST"/img/og/        # 15 images
```

**3. Verify before committing.** This should print `19` and then nothing:

```
cd ~/Developer/GitHub/skill_marketplace
grep -c 'class="blog-card"' packages/server/public/blog/index.html
for s in claude-code-install claude-code-plan-mode claude-code-permissions claude-code-review \
         claude-code-agent-teams claude-code-pricing claude-code-subagents claude-code-hooks \
         claude-code-commands claude-code-memory claude-code-plugins; do
  n=$(grep -l "href=\"/blog/$s\"" packages/server/public/blog/{how-to-add-skills-to-claude-code,claude-code-mcp,claude-code-router,claude-code-vs-cursor,claude-code-vs-gemini-cli,codex-vs-claude-code,claude-code-marketplace}.html 2>/dev/null | wc -l)
  [ "$n" -lt 2 ] && echo "UNDER-LINKED: $s has only $n inbound links from indexed pages"
done
```

Every one of those 11 slugs must be linked from **at least 2** of the 7 indexed articles. That is
the property that makes them discoverable; if the loop prints anything, the copy was incomplete.

**4. Commit and push.** Railway auto-deploys from GitHub.

## 5. Then do the two things that can't be automated from here

Both are in Search Console, and both matter more than anything in step 4.

**a. Re-submit the sitemap.** Google last downloaded it on **2026-03-11** — before any of the June
articles existed. Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**. (The API route
is blocked: the local gcloud token has `webmasters.readonly` scope, so a `PUT` returns 403.)

**b. Request indexing on the 6 orphans.** Search Console → **URL Inspection**, paste each URL,
click **Request Indexing**:

```
https://polyskill.ai/blog/claude-code-pricing
https://polyskill.ai/blog/claude-code-subagents
https://polyskill.ai/blog/claude-code-hooks
https://polyskill.ai/blog/claude-code-commands
https://polyskill.ai/blog/claude-code-memory
https://polyskill.ai/blog/claude-code-plugins
```

Then the 5 new ones once they're live.

## Check it worked

Re-run URL Inspection on the 6 orphans about a week after publishing. The signal to watch is
`coverageState` moving off **"URL is unknown to Google"**. If it hasn't moved after two weeks, the
constraint is crawl budget rather than discovery, and the next lever is external links (P5 in the
2026-05-30 plan), not more content.

## Two notes before you ship

1. **Pricing figures.** The install article states that the free Claude.ai plan does not include
   Claude Code and that Pro/Max/Team/Enterprise/Console do. That was correct against the official
   docs on 2026-08-07. Glance at the pricing page before publishing; these change.
2. **Agent teams is experimental.** That article documents behavior as of Claude Code v2.1.178+ and
   names specific versions where behavior changed. It's the fastest-moving topic in the batch and
   will need a refresh sooner than the other four.
