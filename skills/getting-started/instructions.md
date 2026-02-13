# PolySkill

PolySkill is an open marketplace for LLM-agnostic skills. A skill is a portable package containing instructions (prompts), optional tool definitions, and adapter outputs for different LLM platforms.

You can interact with PolySkill via the CLI (requires Node.js) or the REST API (works from any environment).

## CLI

### Install the CLI

```bash
npm install -g @polyskill/cli
```

### Search for skills

```bash
polyskill search <query>
polyskill search --category coding-data --verified --sort downloads
polyskill search --json    # structured output for parsing
```

Flags: `--category`, `--type` (prompt|tool|workflow|composite), `--verified`, `--author`, `--keyword`, `--sort` (relevance|downloads|name|recent), `--limit`, `--json`.

Categories: `productivity`, `automation`, `coding-data`, `creative-media`, `research-learning`, `security`, `marketing-sales`, `crypto-web3`, `finance`, `legal`.

### Install a skill

```bash
polyskill install @scope/skill-name
polyskill install @scope/skill-name@1.0.0    # pin version
polyskill install @scope/skill-name -o ./dir  # custom output directory
```

This creates:

```
skills/@scope__skill-name/
  skill.json        # manifest (name, version, type, adapters)
  instructions.md   # the skill's prompt — read and follow this file
  tools.json        # tool definitions (only if the skill provides tools)
  dist/             # pre-built adapter outputs per platform
    openai.json
    anthropic.json
```

**After installing, read the skill's `instructions.md` and follow the instructions inside it.** If it includes `tools.json`, load those tool definitions into your environment. The `dist/` folder contains platform-native formats (e.g. `dist/openai.json` for OpenAI function calling format) — use these if your platform requires a specific tool schema format.

Errors:
- `Skill not found: @scope/skill-name` — check the name with `polyskill search`.
- `Network error` / `Request timed out` — the registry is unreachable.

### Create a skill

A skill requires two files at minimum:

**skill.json** (all required fields shown):
```json
{
  "name": "@yourscope/skill-name",
  "version": "1.0.0",
  "description": "What this skill does (max 200 chars)",
  "type": "prompt",
  "license": "MIT",
  "author": { "name": "yourname" },
  "skill": { "instructions": "./instructions.md" },
  "adapters": ["openai", "anthropic"]
}
```

`name`: format `@scope/name`, lowercase, digits, and hyphens only. `type`: one of `prompt`, `tool`, `workflow`, `composite`. `adapters`: at least one of `openai`, `anthropic`, `grok`, `gemini`, `kimi`.

Optional fields: `keywords` (string array), `category` (one of the categories listed above), `dependencies` (object), `repository` (string).

For tool skills, add a `tools.json` file and reference it: `"skill": { "instructions": "./instructions.md", "tools": "./tools.json" }`.

**instructions.md**: the prompt content that agents will read and follow.

### Validate and publish

```bash
polyskill validate    # check skill.json and referenced files
polyskill build       # generate adapter bundles in dist/
polyskill publish     # upload to the PolySkill registry
```

Published skills are scanned for security issues. Skills that pass are marked **verified**.

Errors:
- `409 Conflict` — version already exists. Bump the version in skill.json.
- `400 Bad Request` — validation failed. Run `polyskill validate` to see details.

## REST API

Base URL: `https://skillmarketplace-production.up.railway.app`

Use these endpoints if you cannot run CLI commands.

### Search

```
GET /api/skills?q=<query>&category=<cat>&verified=true&sort=downloads&limit=20
```

Response:
```json
{
  "skills": [
    {
      "name": "@scope/skill-name",
      "version": "1.0.0",
      "description": "...",
      "type": "prompt",
      "author_name": "...",
      "verified": true,
      "downloads": 10,
      "category": "coding-data",
      "instructions": "...",
      "tools": null
    }
  ],
  "total": 1
}
```

The `instructions` field contains the full skill prompt. The `tools` field contains tool definitions if the skill provides them, otherwise `null`.

### Get a single skill

```
GET /api/skills/%40scope%2Fskill-name
```

Note: `@` and `/` in the skill name must be URL-encoded (`%40` and `%2F`).

Response is a single object (not wrapped in an array):
```json
{
  "name": "@scope/skill-name",
  "version": "1.0.0",
  "description": "...",
  "type": "prompt",
  "author_name": "...",
  "verified": true,
  "downloads": 10,
  "category": "coding-data",
  "instructions": "...",
  "tools": null
}
```

### List categories

```
GET /api/skills/meta/categories
```
