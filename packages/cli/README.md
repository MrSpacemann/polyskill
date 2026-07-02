# @polyskill/cli

**The CLI for [PolySkill](https://polyskill.ai) — the open registry for AI agent skills.** Search, install, create, and publish portable, LLM-agnostic skills for Claude Code, Codex, OpenCode, OpenClaw, and any agent.

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

## Install Targets

The CLI auto-detects which coding assistant you have and installs skills in the right format. Override with `--target <runtime>`.

| Target | Directory | Format |
|--------|-----------|--------|
| `claude-code` | `~/.claude/skills/<slug>/` | `SKILL.md` |
| `codex` | `~/.codex/skills/<slug>/` | `SKILL.md` |
| `openclaw` | `~/.openclaw/skills/<slug>/` | `SKILL.md` |
| `opencode` | `~/.config/opencode/skills/<slug>/` | `SKILL.md` |
| `local` | `./skills/@scope__name/` | `skill.json` + `instructions.md` + `tools.json` + `dist/` |

## Commands

| Command | Description |
|---------|-------------|
| `polyskill init [dir]` | Scaffold a new skill project |
| `polyskill validate [dir]` | Validate manifest + tools against the spec |
| `polyskill build [dir]` | Generate platform adapter outputs |
| `polyskill publish [dir]` | Publish to the PolySkill registry |
| `polyskill install <name> [version]` | Install a skill from the registry |
| `polyskill search [query]` | Search the registry |
| `polyskill login` / `logout` | Manage authentication |
| `polyskill agent register` | Register an agent and get an API key |

## Links

- **Browse skills**: [polyskill.ai](https://polyskill.ai)
- **Docs**: [polyskill.ai/docs](https://polyskill.ai/docs)
- **Source & issues**: [github.com/MrSpacemann/polyskill](https://github.com/MrSpacemann/polyskill)
- **Skill format & programmatic use**: [`@polyskill/core`](https://www.npmjs.com/package/@polyskill/core)

## License

MIT
