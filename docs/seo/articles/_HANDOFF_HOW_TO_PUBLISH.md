# How to publish these articles (2026-05-30)

Everything here is **publish-ready** and matches the live blog template exactly. The blog is served as static files from the **skill_marketplace** repo at `packages/server/public/`. These files were staged in the polyskill repo (the kanban worktree) so they live with the task; you copy them into skill_marketplace to go live.

## What's in this folder
- **5 new articles** (publish-ready HTML): `claude-code-pricing.html`, `claude-code-subagents.html`, `claude-code-hooks.html`, `claude-code-commands.html`, `claude-code-memory.html`
- **3 updated existing pages** in `updates/`: `how-to-add-skills-to-claude-code.html` (flagship), `claude-code-mcp.html`, `index.html` (blog index with the 5 new cards)
- **15 images** in `img/og/`: one OG/hero per article at 1200×669 + `-600w` / `-1000w` responsive variants

## Publish steps (copy-paste)

**1. Get skill_marketplace up to date** (your local clone is 14 commits behind):
```
cd ~/Developer/GitHub/skill_marketplace
git pull
```

**2. Copy the 5 new articles + 3 updated pages into the blog:**
```
STAGE="~/Developer/GitHub/polyskill/.worktrees/d85f077e-3ea6-4f23-9210-4232b319ab27/docs/seo/articles"
DEST=~/Developer/GitHub/skill_marketplace/packages/server/public/blog
cp "$STAGE"/claude-code-pricing.html "$STAGE"/claude-code-subagents.html "$STAGE"/claude-code-hooks.html "$STAGE"/claude-code-commands.html "$STAGE"/claude-code-memory.html "$DEST"/
cp "$STAGE"/updates/*.html "$DEST"/      # overwrites how-to-add-skills, claude-code-mcp, index with the updated versions
```

**3. Copy the images:**
```
cp "$STAGE"/img/og/*.jpg ~/Developer/GitHub/skill_marketplace/packages/server/public/img/og/
```

**4. Review locally, then commit + deploy** (your normal skill_marketplace deploy — Railway per the repo config).

## Before you ship — two notes
1. **Pricing numbers:** the pricing article states Claude Code's plan structure (Free / Pro $20 / Max $100 & $200, or API pay-per-token) and tells readers to confirm exact figures on Anthropic's pricing page. Glance at it to confirm the figures still match before publishing — they change.
2. **List style:** the new articles use the same `<strong>Label</strong>:text` (no space after the colon) convention as your 8 existing posts, to stay consistent. If you ever decide to add a space, do it site-wide so all posts match.

## Quality
All 5 new articles passed an independent analyzer loop (SEO Beast 5-dimension quality gate, AI-citability, HCU de-templating, AI-signature scrub, and technical-accuracy check against the official Claude Code docs). Scores: pricing 91, subagents 89, hooks 91, commands (fixed) ~88, memory 88 — all ≥85 composite, all ≥82 citability. The commands article's argument syntax was corrected to the verified 0-based `$0`/`$1` and backtick `` !`cmd` `` bash-injection form.
