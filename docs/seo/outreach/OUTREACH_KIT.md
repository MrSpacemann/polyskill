# PolySkill Outreach Kit

**What this is:** Copy-paste drafts for things only you can post (under your own accounts). Use these as-is or tweak the voice. Everything below uses only verified targets — no invented repos, URLs, or stats.

**PolySkill in one line:** Open-source, LLM-agnostic registry to search, install, create & publish Claude Code skills. CLI (`@polyskill/cli`) + web. Every skill is security-scanned before listing. It's the missing `npm`-style registry for skills people currently share by zipping folders by hand.

- Site: https://polyskill.ai
- Repo: https://github.com/MrSpacemann/polyskill

> **READ FIRST — caveats that affect what you post:**
> - **Reddit dates are INFERRED (medium confidence) and the threads were NOT directly fetched.** Open every Reddit link, confirm it's recent, relevant, and not locked, and follow each subreddit's self-promotion rules before replying.
> - **HN items are timestamp-verified.**
> - Some awesome-list contribution paths are unconfirmed (flagged inline). Check before submitting.

---

## 1. GitHub awesome-list PR entries

**Standard entry (adapt the wording slightly per list so it doesn't read as copy-paste spam):**

```markdown
- [PolySkill](https://polyskill.ai) - Open-source registry to search, install, create & publish Claude Code skills; CLI + web, every skill security-scanned.
```

### ComposioHQ/awesome-claude-skills
- **Section:** Propose a "Discovery / Registry" entry (or the closest tooling/ecosystem section).
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source registry to discover, install, create & publish Claude Code skills (CLI + web); every skill is security-scanned before listing.
  ```
- **Submit:** Has a CONTRIBUTING file — read it first, then open a PR.

### travisvn/awesome-claude-skills
- **Section:** Tools, or Community Skills.
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - npm-style registry for Claude Code skills: search, install, create & publish from a CLI or the web. Open source, security-scanned listings.
  ```
- **Submit:** PR.

### karanb192/awesome-claude-skills
- **Section:** Meta Skills.
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source, LLM-agnostic registry to search, install, create & publish Claude Code skills; CLI + web, all listings security-scanned.
  ```
- **Submit:** PR.

### jqueryscript/awesome-claude-code
- **Section:** Tools & Utilities (it sits naturally alongside skillshare / skills-manager).
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Registry + CLI to search, install, create and publish Claude Code skills, with security scanning on every listing.
  ```
- **Submit:** PR.

### eltociear/awesome-AI-driven-development
- **Section:** Skills.
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source registry for Claude Code skills — search, install, create & publish via CLI or web; every skill security-scanned.
  ```
- **Submit:** PR.

### jamesmurdza/awesome-ai-devtools
- **Section:** Configuration & Context Management (alongside Conduit8 / TokRepo — direct analogs).
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source registry to search, install, create & publish Claude Code skills (CLI + web), with security scanning on each listing.
  ```
- **Submit:** PR.

### hesreallyhim/awesome-claude-code  *(largest list)*
- **Section:** Best fit is a tooling/registry section — check the current structure.
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source registry to search, install, create & publish Claude Code skills; CLI + web, every skill security-scanned.
  ```
- **CAVEAT — contribution path unconfirmed:** The CONTRIBUTING file returned a 404. This repo may take submissions via **issues** rather than PRs. **Open the repo and check the README / open issues for the intake process before submitting.**

### VoltAgent/awesome-agent-skills
- **CAVEAT — likely not a fit yet:** This list tends to **reject brand-new tools** and curates **individual skills, not registries**. Two options:
  1. **Revisit later** once PolySkill has more traction.
  2. **Submit a specific, useful individual skill** (not the registry) if that matches the list's format.
- Don't submit the registry entry here until you've confirmed the list accepts ecosystem/registry tools.

### Registries (not awesome-lists)

**majiayu000/claude-skill-registry**
- **Option A:** Open an "Add Skill" issue.
- **Option B:** PR to `-core/sources/community.json`.
- Pick whichever the repo README recommends; the issue route is lower-friction if unsure.

**awesomeclaude.ai / BehiSecc repo**
- **Submit:** Open an issue or a PR (check the repo for which it prefers).
- **Entry:**
  ```markdown
  - [PolySkill](https://polyskill.ai) - Open-source registry to search, install, create & publish Claude Code skills; CLI + web, security-scanned listings.
  ```

---

## 2. Community thread replies

> **CAVEAT (applies to every Reddit item below):** Dates are INFERRED (medium confidence) and threads were NOT directly fetched. **Before posting:** open the link, confirm the thread is recent, on-topic, and not locked/archived; read the subreddit rules; lead with value; disclose that you're affiliated with PolySkill. **HN items are timestamp-verified.**

### TOP threads (prioritize)

**1. https://reddit.com/r/ClaudeCode/comments/1ubdz8g** — managing/syncing skills across machines *(recency HIGH)*
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

The pattern that's worked for me is to stop treating skills as loose folders and put them under version control — a single repo of skill directories you clone on each machine, then symlink into your skills path. That gives you sync + history for free. The friction is discovery and sharing across people, which is what pushed me toward PolySkill (full disclosure, I'm involved with it): it's an open-source registry where you install/publish skills like npm packages instead of zipping folders around, so syncing is a `polyskill install` instead of a manual copy. Either way, the key is making "where the skill lives" a deliberate location, not your Downloads folder. Happy to share my symlink setup if that's useful.

**2. https://reddit.com/r/ClaudeCode/comments/1tkvg6t** — do you actually use hooks?
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

Yes, but selectively — the ones that earn their keep for me are a `PostToolUse` formatter (auto-runs the linter after edits) and a notification hook so I know when a long run finishes. The trap is over-hooking: every hook adds a place things can silently fail, so I only add one once I've felt the pain it solves. If you want a fuller breakdown of the hook events and where each one is actually worth wiring up, we wrote a guide on it: https://polyskill.ai/blog/claude-code-hooks (I'm affiliated). Curious which events others have found genuinely worth it vs. just neat.

**3. https://reddit.com/r/ClaudeAI/comments/1s4w618** — spent $100+ on Claude, regretting Max? *(high engagement)*
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

Whether Max is worth it really comes down to your usage shape, not the headline price — if you're hitting limits daily on the lower tier, the math often favors upgrading; if you spike occasionally, pay-as-you-go API can be cheaper. The thing most people miss is measuring their actual token burn before deciding, because the "regret" usually comes from picking a plan blind. We put together a breakdown of the pricing tiers and when each one makes sense here: https://polyskill.ai/blog/claude-code-pricing (disclosure: I work on PolySkill). What's your rough daily usage — that's the number that decides it.

**4. https://reddit.com/r/ClaudeCode/comments/1ru97vz** — memory not being read / CLAUDE.md best practices
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

A few things that fixed this for me: keep `CLAUDE.md` short and imperative (it competes for context, so a 500-line file gets diluted), put project-specific rules in the project file and personal ones in `~/.claude/CLAUDE.md`, and remember it's loaded at session start — so mid-session edits don't take effect until you reload. If it's genuinely being ignored, it's usually buried under too much other context rather than "not read." I wrote up the memory hierarchy and what actually sticks here: https://polyskill.ai/blog/claude-code-memory (I'm affiliated). What does your current file look like, length-wise?

**5. https://reddit.com/r/ClaudeCode/comments/1rahdie** — making subagents fire reliably
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

The reliability issue is almost always the description field — subagents get dispatched based on how clearly their description matches the task, so vague descriptions mean they never trigger. Make the description action-oriented and specific about *when* to use it ("use when X, before Y"), and the dispatch gets much more consistent. It also helps to be explicit in your prompt that the work should be delegated. Full walkthrough of getting subagents to fire predictably: https://polyskill.ai/blog/claude-code-subagents (disclosure: PolySkill is my project). What do your current descriptions look like?

**6. https://reddit.com/r/ClaudeCode/comments/1synh1e** — best plugins, and does anyone actually measure?
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

Honestly "measuring" plugin impact is the hard part — most people (me included, at first) judge by vibes. What's worked is picking one workflow, timing it before/after, and being willing to remove plugins that don't move the needle, because each one is context and surface area. On the "best" question it really depends what you're optimizing for; we put together a rundown of plugins worth trying and how to think about whether they're paying off: https://polyskill.ai/blog/claude-code-plugins (I'm affiliated). What workflow are you trying to speed up — that narrows the list a lot.

**7. https://reddit.com/r/ClaudeCode/comments/1typ8fb** — replacing Claude Code with local models on an M5 Max *(recency HIGH)*
> *Caveat: verify recency/relevance/not-locked + disclose affiliation before posting.*

An M5 Max can run solid local models, but the honest tradeoff is that local coding models still trail Claude on long, multi-file agentic work — so a common middle path is routing: keep Claude Code as the interface and route some calls to a local/cheaper model for the simpler stuff. That gets you cost savings without giving up the good model on the hard tasks. We wrote up how routing works and where it helps vs. hurts here: https://polyskill.ai/blog/claude-code-router (disclosure: I work on PolySkill). What kind of tasks are you mostly hoping to offload locally — that decides whether it's worth it.

**8. https://news.ycombinator.com/item?id=47854570** — Ask HN: Claude Code Alternative *(timestamp-verified)*
> *Caveat: HN timestamp-verified — still read the thread and follow HN norms (no marketing tone).*

Depends what you're trying to escape — cost or lock-in. If it's cost, you don't necessarily need a different tool; routing some requests to cheaper/local models from within Claude Code covers a lot of it, and the pricing tradeoffs are more nuanced than the sticker price suggests. If it's lock-in, the open-source ecosystem around it has gotten decent. For reference I've found these two write-ups useful on the routing and pricing angles: https://polyskill.ai/blog/claude-code-router and https://polyskill.ai/blog/claude-code-pricing (disclosure: those are on a project I work on). What's the main thing pushing you to look for an alternative?

### Secondary threads (verify carefully before posting)

> Same Reddit caveat applies, and these are lower-confidence matches — confirm each is actually on-topic before engaging.

- **https://reddit.com/r/claude/comments/1toj0bo** — private marketplace → blog/claude-code-marketplace
- **https://reddit.com/r/ClaudeAI/comments/1sa8eq5** — new user tips → blog/how-to-add-skills
- **https://reddit.com/r/ClaudeCode/comments/1p48uil** — hooks confuse everyone → blog/claude-code-hooks
- **https://reddit.com/r/ClaudeCode/comments/1rzw6yy** — dealing with memory → blog/claude-code-memory
- **https://reddit.com/r/ClaudeAI/comments/1oivw1p** — $100 vs $200 → blog/claude-code-pricing
- **https://reddit.com/r/ClaudeCode/comments/1ry7f89** — adding an MCP server → blog/claude-code-mcp
- **https://reddit.com/r/ClaudeCode/comments/1qgxxkd** — OpenRouter → blog/claude-code-router

---

## 3. Launch copy

### Show HN

**Title:**
```
Show HN: PolySkill – An open-source npm-style registry for Claude Code skills
```

**Body:**
> PolySkill is an open-source registry to search, install, create, and publish Claude Code skills. Right now people share skills by zipping up folders and passing them around manually — there's no common place to discover or distribute them, which felt like the early days before package managers existed. So we built the missing piece: a CLI (`@polyskill/cli`) and a web app where you install a skill with one command and publish your own just as easily. It's LLM-agnostic, the code is open source, and every skill is security-scanned before it gets listed. We'd genuinely like feedback on the model — what's missing, what would make you actually use it over copying folders, and whether the security-scan approach is the right call. Repo: https://github.com/MrSpacemann/polyskill

### Product Hunt

**Tagline (≤60 chars):**
```
The npm-style registry for Claude Code skills
```
(46 chars)

**Description:**
> PolySkill is an open-source, LLM-agnostic registry for Claude Code skills. Instead of zipping folders to share skills, you search, install, create, and publish them from a CLI or the web. Every skill is security-scanned before it's listed.

**Features:**
- 🔍 Search a growing registry of Claude Code skills
- ⚡ Install with one command via `@polyskill/cli`
- 🚀 Create and publish your own skills to share
- 🛡️ Every listed skill is security-scanned

### dev.to article angle

**Title:**
```
Stop zipping folders: how to share and reuse Claude Code skills the easy way
```

**3-bullet outline:**
- **The problem, honestly:** how skill-sharing works today (manual folders/zips), why it doesn't scale, and what a registry model borrows from npm.
- **Hands-on walkthrough:** build a small real skill, then install one from the registry and publish your own with `@polyskill/cli` — actual commands and output.
- **Doing it safely + next steps:** what security scanning checks for, how to keep skills synced across machines, and where to go deeper.

---

## 4. Newsletter pitch

**To:** support@claude-world.com (ClaudeWorld Weekly)
**Subject:** A tool for your readers: an open-source registry for Claude Code skills

> Hi ClaudeWorld team,
>
> I read ClaudeWorld Weekly and figured this might fit your tools section. I work on PolySkill, an open-source registry for Claude Code skills — basically the npm-style index that doesn't exist yet for skills.
>
> Right now people discover and share skills by zipping folders and passing them around by hand, which gets messy fast. PolySkill lets you search, install, create, and publish skills from a CLI (`@polyskill/cli`) or the web, and every listed skill is security-scanned before it goes up. It's LLM-agnostic and fully open source, so there's no lock-in for your readers to worry about.
>
> If it's a fit, I'm happy to write a short blurb in your format or answer anything for a mention. Either way, thanks for the newsletter — it's a genuinely useful read.
>
> Site: https://polyskill.ai · Repo: https://github.com/MrSpacemann/polyskill
>
> Thanks,
> [Your name]

---

## Verification reminder (read before you post anything)

- **Reddit dates are INFERRED (medium confidence) and the threads were not directly fetched** — open every Reddit link, confirm it's recent, relevant, and not locked/archived, follow each subreddit's self-promotion rules, lead with value, and disclose affiliation. **HN items are timestamp-verified.**
- **hesreallyhim/awesome-claude-code:** contribution path is unconfirmed (CONTRIBUTING 404'd) — it may intake via issues; check the repo before submitting.
- **VoltAgent/awesome-agent-skills:** tends to reject brand-new tools and curates individual skills, not registries — revisit later or submit a specific skill instead.
- **claudemarketplaces.com is unstable / redirects** — don't rely on it as a target.
