# @polyskill/core

**Core library for [PolySkill](https://polyskill.ai) skills** — the skill spec, JSON-schema validation, disk loading, and adapter transpilation to platform-specific formats (OpenAI, Anthropic, Grok, Gemini, Kimi).

Most users want the CLI instead: [`@polyskill/cli`](https://www.npmjs.com/package/@polyskill/cli).

## Install

```bash
npm install @polyskill/core
```

## Usage

```typescript
import { validateManifest, loadSkill, getAdapter } from "@polyskill/core";

// Validate a skill.json manifest
const result = validateManifest(manifest);
if (!result.valid) console.error(result.errors);

// Load a skill directory (skill.json + instructions.md + tools.json)
const skill = await loadSkill("./my-skill");

// Transpile to a platform format
const adapter = getAdapter("openai");
const { systemPrompt, tools } = adapter.transpile(skill);
```

## What's inside

- **JSON schemas** for `skill.json` and `tools.json`
- **Validator** using ajv with strict schema checking
- **Loader** to read and resolve skills from disk
- **Adapters** to transpile skills into platform-specific formats, plus an
  `openaiCompatibleAdapter(platform)` factory for any OpenAI-compatible runtime

## Links

- **Browse skills**: [polyskill.ai](https://polyskill.ai)
- **Docs**: [polyskill.ai/docs](https://polyskill.ai/docs)
- **Source & issues**: [github.com/MrSpacemann/polyskill](https://github.com/MrSpacemann/polyskill)

## License

MIT
