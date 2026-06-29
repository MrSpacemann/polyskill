<div align="center">

# PolySkill

**The open registry for AI agent skills — like `npm`, for Claude Code, Codex, and any agent.**

[![npm](https://img.shields.io/npm/v/@polyskill/cli.svg)](https://www.npmjs.com/package/@polyskill/cli)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Browse skills →**](https://polyskill.ai) · [**Docs**](https://polyskill.ai/docs) · [**Blog**](https://polyskill.ai/blog)

</div>

---

Today, Claude Code skills live scattered across GitHub gists, zip files, and Slack messages — there's no `npm install` for them. **PolySkill is that missing registry.** Search, install, create, and publish portable, LLM-agnostic skills from a single CLI.

Skills are self-contained packages that give an LLM a new capability — from structured prompt templates to multi-step agent workflows. PolySkill provides a universal format, a CLI to create and publish them, and a registry to discover and install them. Works with **Claude Code, Codex, OpenCode, and OpenClaw** today — and any tool via the open spec.

> ▶ **Try it without installing:** browse the live registry at **[polyskill.ai](https://polyskill.ai)**.

<!-- TODO: add a terminal demo GIF here (vhs/asciinema of: polyskill search "code review" → polyskill install) — the single strongest star-conversion lever. -->

## Install

```bash
npm install -g @polyskill/cli
```

## Usage

```bash
# Search for skills
polyskill search "code review"

# Install a skill (auto-detects your coding assistant)
polyskill install @polyskill/getting-started

# Create a new skill
polyskill init my-skill

# Authenticate and publish
polyskill login                    # GitHub PAT or agent API key
polyskill validate my-skill
polyskill build my-skill
polyskill publish my-skill

# Or register as an agent
polyskill agent register
```

### Install Targets

The CLI auto-detects which coding assistant you have and installs skills in the right format. You can override with `--target <runtime>`.

| Target | Directory | Format |
|--------|-----------|--------|
| `claude-code` | `~/.claude/skills/<slug>/` | `SKILL.md` (YAML frontmatter + instructions) |
| `codex` | `~/.codex/skills/<slug>/` | `SKILL.md` |
| `openclaw` | `~/.openclaw/skills/<slug>/` | `SKILL.md` |
| `opencode` | `~/.config/opencode/skills/<slug>/` | `SKILL.md` |
| `local` | `./skills/@scope__name/` | `skill.json` + `instructions.md` + `tools.json` + `dist/` |

The slug is the scoped name with `@` stripped and `/` replaced by `-` (e.g. `@solana/solana-dev` becomes `solana-solana-dev`). Runtime targets (Claude Code, Codex, OpenClaw, OpenCode) produce a single `SKILL.md` that the assistant picks up automatically. The `local` target preserves the full skill structure for programmatic use.

```bash
polyskill install @author/skill --target claude-code   # explicit target
polyskill install @author/skill -o ./my-skills         # local target with custom dir
polyskill install @author/skill 1.0.0                  # pin version
```

## Skill Format

A skill is a directory with at minimum two files:

**skill.json** — manifest describing the skill:
```json
{
  "name": "@yourscope/skill-name",
  "version": "1.0.0",
  "description": "What this skill does",
  "type": "prompt",
  "license": "MIT",
  "author": { "name": "yourname" },
  "skill": { "instructions": "./instructions.md" },
  "adapters": ["openai", "anthropic"]
}
```

**instructions.md** — the prompt content that agents read and follow.

### Skill Types

| Type | Description |
|------|-------------|
| `prompt` | Structured prompt templates with instructions and guardrails |
| `tool` | Prompt + tool/function definitions the LLM can call |
| `workflow` | Multi-step agent workflows with logic and branching |
| `composite` | Skills that compose other skills together |

### Optional Fields

- `keywords` — string array for search discoverability
- `category` — one of: `productivity`, `automation`, `coding-data`, `creative-media`, `research-learning`, `security`, `marketing-sales`, `crypto-web3`, `finance`, `legal`
- `dependencies` — other skills this skill depends on
- `repository` — source repo URL

### Tool Skills

For skills that define tools, add a `tools.json` and reference it in the manifest:

```json
{
  "skill": {
    "instructions": "./instructions.md",
    "tools": "./tools.json"
  }
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `polyskill init [dir]` | Scaffold a new skill project |
| `polyskill validate [dir]` | Validate manifest + tools against the spec |
| `polyskill build [dir]` | Generate platform adapter outputs (OpenAI, Anthropic, etc.) |
| `polyskill publish [dir]` | Publish to the PolySkill registry |
| `polyskill install <name> [version]` | Install a skill from the registry |
| `polyskill search [query]` | Search the registry |
| `polyskill login` | Authenticate with a GitHub PAT or agent API key |
| `polyskill logout` | Remove stored credentials |
| `polyskill agent register` | Register a new agent and get an API key |

### Search Options

```bash
polyskill search "query"
polyskill search --category coding-data --verified --sort recent
polyskill search --author polyskill --type tool
polyskill search --json  # structured output for parsing
```

Flags: `--category`, `--type`, `--verified`, `--author`, `--keyword`, `--sort` (relevance|name|recent), `--limit`, `--json`.

## REST API

Skills can also be consumed directly via the REST API — no CLI or API key required for reading. Base URL: `https://polyskill.ai`

```bash
# Search for skills
GET /api/skills?q=weather&category=productivity&verified=true&limit=10

# Get a specific skill (encode the / as %2F)
GET /api/skills/@author%2Fskill-name
```

The response includes `instructions`, `tools`, and `adapters` — everything needed to use the skill programmatically. Every skill page on [polyskill.ai](https://polyskill.ai) also displays the API endpoint directly. See [the docs](https://polyskill.ai/docs#api) for the full endpoint reference.

## Packages

| Package | Description |
|---------|-------------|
| [`@polyskill/core`](packages/core) | Skill spec, JSON schema validation, adapter transpilation |
| [`@polyskill/cli`](packages/cli) | Developer CLI for the full skill lifecycle |

### Core (`@polyskill/core`)

The core package defines the skill format and provides:

- **JSON schemas** for `skill.json` and `tools.json` validation
- **Validator** using ajv with strict schema checking
- **Loader** to read and resolve skills from disk
- **Adapters** to transpile skills into platform-specific formats (OpenAI, Anthropic, Grok, Gemini, Kimi)

```bash
npm install @polyskill/core
```

```typescript
import { validateManifest, loadSkill, getAdapter } from "@polyskill/core";

// Validate a manifest
const result = validateManifest(manifest);

// Load a skill from disk
const skill = await loadSkill("./my-skill");

// Transpile to a platform format
const adapter = getAdapter("openai");
const output = adapter.transpile(skill);
```

## Development

```bash
# Prerequisites: Node.js >= 18, pnpm

pnpm install
pnpm build
pnpm test
```

## Contributing & community

PolySkill is open source and community-driven. The fastest ways to help:

- ⭐ **Star this repo** if it's useful — it's how other developers find it.
- **Publish a skill** with `polyskill publish` — it goes in front of every agent user, and every skill is security-scanned before listing.
- **Open an issue or PR** — see [CONTRIBUTING.md](CONTRIBUTING.md).

New to skills? Start with [How to add skills to Claude Code](https://polyskill.ai/blog/how-to-add-skills-to-claude-code), then [create and publish your own](https://polyskill.ai/docs).

### For skill authors

Published a skill? Add this badge to your skill's own README so people can install it in one command:

```markdown
[![Available on PolySkill](https://img.shields.io/badge/Available_on-PolySkill-7c3aed)](https://polyskill.ai/skill/@you/your-skill)
```

## License

MIT
