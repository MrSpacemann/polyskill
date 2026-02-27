# PolySkill

An open format and CLI for portable, LLM-agnostic Skills that any AI model or agent can discover, install, and use.

Skills are self-contained packages that give an LLM a new capability — from structured prompt templates to multi-step agent workflows. PolySkill provides a universal format, a CLI to create and publish them, and a registry to discover and install them.

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

## License

MIT
