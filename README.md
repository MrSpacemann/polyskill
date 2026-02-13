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

# Install a skill
polyskill install @polyskill/getting-started

# Create a new skill
polyskill init my-skill

# Validate and publish
polyskill validate my-skill
polyskill build my-skill
polyskill publish my-skill
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

### Search Options

```bash
polyskill search "query"
polyskill search --category coding-data --verified --sort downloads
polyskill search --author polyskill --type tool
polyskill search --json  # structured output for parsing
```

Flags: `--category`, `--type`, `--verified`, `--author`, `--keyword`, `--sort` (relevance|downloads|name|recent), `--limit`, `--json`.

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
