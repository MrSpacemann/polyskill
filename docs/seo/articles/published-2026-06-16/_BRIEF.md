# Authoring brief — PolySkill blog articles (2026-05-30)

You are writing a publish-ready blog post for **polyskill.ai** (PolySkill — an open-source, LLM-agnostic registry where developers search, install, create, and publish Claude Code *skills*; every skill is security-scanned before listing). Output is a single static **HTML file**.

## 1. Match the template EXACTLY
Read the canonical template: `/tmp/tpl-mcp.html` (the live `claude-code-mcp` post pulled from origin/main).
Replicate its structure byte-for-byte, changing only the content:
- Full `<head>` scaffold: same GTM snippet, viewport, favicons, fonts, `/css/style.css` + `/css/blog.css`, `theme-init.js`. Swap the `<title>`, both `<meta name="description">`/og/twitter, canonical URL, and `og:image`/`twitter:image` to this article's slug.
- **Three JSON-LD blocks** in `<head>`, same shape: `Article` (with `author` = `{"@type":"Organization","name":"PolySkill Team","url":"https://polyskill.ai"}`, `publisher` PolySkill w/ logo + `sameAs:["https://github.com/MrSpacemann/polyskill"]`, `datePublished`/`dateModified` = `"2026-05-30"`, `image`, `mainEntityOfPage`), `BreadcrumbList` (Home → Blog → this article), and `FAQPage` whose questions **exactly match** the visible `<h3>` questions in your FAQ section.
- Body: identical `<header class="site-header">` nav and `<footer class="site-footer">` (copy verbatim). Same `<main id="main-content" class="container docs-main"><article class="blog-article">` wrapper, `blog-article-header` (h1.blog-article-title + `<div class="blog-article-meta">Published May 30, 2026 · Updated May 30, 2026</div>`), hero `<img class="blog-hero-img" ... width="1200" height="669">` with the same `srcset`/`sizes` pattern pointing at `/img/og/<slug>.jpg` (+ `-600w`/`-1000w` variants), `<div class="blog-article-body">`, a `<div class="blog-tldr">` opener (label "In one line"), and the closing `<div class="blog-faq-section">` + `<a href="/blog" class="blog-back">Back to Blog</a>`. End with the same CSS/script tags after `</footer>`.
- Markup conventions: `<h2 id="kebab-id">`, `<pre><code>` for commands, `<div class="table-wrap"><table>` with `<th scope="col">`, `<ul><li><strong>Label</strong>:text</li>` (note: no space after the colon — matches their CSS).

## 2. Content Writing Framework (non-negotiable)
- **Hook** (first 1–2 sentences): NEVER open with "X is…" or "When it comes to…". Use the hook type named in your spec. Put the **primary keyword in the first 100 words**.
- **APP** after the hook: Agree (acknowledge a belief) → Promise (what they'll learn) → Preview.
- **2–3 mini-stories**: a named person ("Maya", "the team at Northwind"), a concrete situation with real numbers/dates, a clear outcome. Place one early, one mid, one near the end.
- **2–3 contextual CTAs**, escalating: soft ("Browse the skill registry") within the first ~500 words, medium mid-article, one stronger near the end. Point to `/browse` or `/`. Make them relate to the surrounding section. Never "click here".
- Paragraphs 2–4 sentences. Mix short punchy + longer sentences. 5–7 H2s. Active voice 80%+. Grade 8–10.
- **Every brand/product mention earned** — ≤3 PolySkill mentions in the body, never in a verdict/conclusion as a plug.

## 3. AI-signature scrub (the analyzer WILL fail you on these)
Ban these phrases: "In today's…", "When it comes to", "It's important to note", "Let's dive in", "Furthermore/Moreover/Additionally", "In order to", "leverage"/"utilize", "seamless(ly)/robust/holistic", "game-changer", "unlock the power", "landscape/paradigm/journey". Replace vague words (many/various/significant/often) with concrete numbers. **Max 2 em-dashes in the whole article.** No invisible Unicode.

## 4. De-templating (HCU) — vary from sibling posts
Use the UNIQUE H2 outline in your spec. Your FAQ must share no 4+ word phrase with another post's FAQ. Your closing section uses the voice named in your spec (don't end with a generic "there's no single winner" verdict). Each article must contain ≥1 section of original analysis (a "when NOT to use this" / "where it falls short" angle is encouraged — the template does this well).

## 5. Citability (for AI Overviews / ChatGPT / Perplexity)
The TL;DR and each H2's first paragraph should be a self-contained, extractable answer (a clear definition or 2–4 sentence answer). Lead the FAQ answers with the direct answer. Include specific commands, file paths, and numbers.

## 6. Internal links (add 3–5, in-context)
Link naturally to relevant siblings using these exact paths:
`/blog/how-to-add-skills-to-claude-code`, `/blog/claude-code-mcp`, `/blog/claude-code-plugins`, `/blog/claude-code-marketplace`, `/blog/claude-code-router`, `/blog/claude-code-subagents`, `/blog/claude-code-hooks`, `/blog/claude-code-commands`, `/blog/claude-code-memory`, `/blog/claude-code-vs-gemini-cli`, plus `/browse` (skills) and `/` (home). Include a "Browse next:" line of 3–4 links before the FAQ (as the template does).

## 7. Accuracy
These are real Claude Code features — be technically correct. Subagents live in `.claude/agents/*.md`; hooks in `settings.json` (events: PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStop, PreCompact, SessionStart); custom slash commands in `.claude/commands/*.md` (support `$ARGUMENTS`); memory in `CLAUDE.md` (project/user/enterprise hierarchy, `@path` imports, `#` quick-add). For pricing, present the stable structure (Claude subscription: Free / Pro $20/mo / Max $100 & $200/mo, which include Claude Code usage with limits; **or** Anthropic API pay-per-token) and tell readers to confirm exact figures on the official pricing page (prices change) — do not present volatile numbers as permanent.

---

# Per-article specs

### A) claude-code-pricing.html
- **Title:** `Claude Code Pricing 2026: Plans, API Costs & What You Actually Pay | PolySkill`
- **H1:** `Claude Code Pricing 2026: Plans, API Costs, and What You Actually Pay`
- **Primary kw:** "claude code pricing" (27,100/mo, commercial). Secondary: "claude code cli pricing", "is claude code free", "claude code cost".
- **Hook type:** Surprising statistic / counterintuitive (the "free" question — the cheapest path is often not the obvious one).
- **Unique H2 outline:** How Claude Code Pricing Actually Works (two paths) → The Subscription Plans: Free, Pro, Max (table) → The API Path: Pay Per Token (table) → Subscription vs API: Which Is Cheaper for You → What a Real Month Costs (mini-story w/ numbers) → How to Keep Claude Code Costs Down → Do Skills, Plugins, and MCP Cost Extra? (answer: no extra Anthropic charge — natural place to note PolySkill skills are free/open-source)
- **Closing voice:** decisive/advisory ("Start on Pro, move to Max when you hit limits, reach for the API only when…").
- **FAQ (5):** How much does Claude Code cost? · Is Claude Code free? · Claude Code Pro vs Max — which should I get? · Does Claude Code charge per token? · Do Claude Code skills or plugins cost extra?
- **Note:** SERP has an AI Overview — make the top answer (pricing table + a 2-sentence "how much does it cost") maximally extractable.

### B) claude-code-subagents.html
- **Title:** `Claude Code Subagents (2026): Create, Use & When They're Worth It | PolySkill`
- **H1:** `Claude Code Subagents: How to Create and Use Them (2026)`
- **Primary kw:** "claude code subagents" (2,900). Secondary: "claude code agents" (2,900), "claude code subagent example".
- **Hook type:** Specific scenario (a dev whose main context got polluted by a side-quest).
- **Unique H2 outline:** What a Subagent Is → Creating Your First Subagent (`.claude/agents/*.md` + code) → When Subagents Earn Their Keep (context isolation, parallelism) → Subagents vs Skills vs MCP (table) → "Agents" vs "Subagents": The Naming, Cleared Up → Subagent Patterns Worth Stealing (reviewer, researcher, test-writer) → Where Subagents Fall Short
- **Closing voice:** practitioner/imperative ("Make one subagent for your most repeated side-task and live with it for a week").
- **FAQ (5):** What is a subagent in Claude Code? · How do I create a Claude Code subagent? · What's the difference between agents and subagents? · When should I use a subagent instead of a skill? · Can subagents run in parallel?

### C) claude-code-hooks.html
- **Title:** `Claude Code Hooks (2026): Automate & Control the Agent | PolySkill`
- **H1:** `Claude Code Hooks: Automate and Control the Agent (2026)`
- **Primary kw:** "claude code hooks" (2,900). Secondary: "claude code hooks example", "claude code settings hooks".
- **Hook type:** Bold statement (hooks make the agent deterministic where prompts only ask nicely).
- **Unique H2 outline:** What Hooks Do → The Hook Events (table: PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, Notification, PreCompact, SessionStart) → Configuring a Hook (`settings.json` + code) → Three Hooks Worth Adding Today (auto-format on edit; block a dangerous command; desktop notification on finish) → Hooks vs Skills vs Subagents: Deterministic vs Probabilistic → The Security Side of Hooks (they run with your shell access)
- **Closing voice:** cautionary-then-encouraging ("Add one hook, read what it runs, then trust it").
- **FAQ (5):** What are Claude Code hooks? · How do I add a hook in Claude Code? · What events can a Claude Code hook fire on? · Can a hook block Claude Code from running a command? · Are Claude Code hooks safe?

### D) claude-code-commands.html
- **Title:** `Claude Code Commands (2026): Slash Commands & Custom Workflows | PolySkill`
- **H1:** `Claude Code Commands: Slash Commands and Custom Workflows (2026)`
- **Primary kw:** "claude code commands" (1,900). Secondary: "claude code slash commands" (880), "claude code custom commands" (390).
- **Hook type:** Specific scenario (a dev retyping the same 6-line prompt every morning).
- **Unique H2 outline:** Built-in Slash Commands You Already Have (table) → Custom Slash Commands: Where the Time Goes (`.claude/commands/*.md`) → Passing Arguments with `$ARGUMENTS` (code) → Commands That Pay Off (review, changelog, scaffold) → Commands vs Skills: Which to Reach For → Sharing Commands Across a Team (project scope, git)
- **Closing voice:** ROI/numbers framing ("If you run a prompt twice a week, it's a command").
- **FAQ (5):** What are Claude Code commands? · How do I create a custom slash command? · How do I pass arguments to a Claude Code command? · Where are Claude Code slash commands stored? · What's the difference between a command and a skill?

### E) claude-code-memory.html
- **Title:** `Claude Code Memory & CLAUDE.md (2026): The Complete Guide | PolySkill`
- **H1:** `Claude Code Memory: How CLAUDE.md Works (2026)`
- **Primary kw:** "claude code memory" (1,000, KD3). Secondary: "claude.md", "claude code claude.md".
- **Hook type:** Provocative question (why does Claude forget what you told it yesterday?).
- **Unique H2 outline:** What CLAUDE.md Is → The Memory Hierarchy: Enterprise, Project, User (table) → What Actually Belongs in CLAUDE.md (and what doesn't) → Importing Other Files with `@path` → The `#` Quick-Add Shortcut → Keeping Memory From Rotting (best practices)
- **Closing voice:** discipline/maintenance framing ("A CLAUDE.md you never prune becomes noise the agent learns to ignore").
- **FAQ (5):** What is Claude Code memory? · What is CLAUDE.md? · Where does Claude Code store memory? · What should I put in CLAUDE.md? · How do I import files into CLAUDE.md?

---
**Output:** Write the complete HTML to `docs/seo/articles/<slug>.html` (absolute path under the repo root). Then reply with a 2-line summary: word count + any framework rule you couldn't satisfy.
