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

# Sign in once per computer, then every update is one command
polyskill login                    # opens polyskill.ai: sign in with GitHub, click Claim
polyskill publish my-skill         # validates, builds the adapters, publishes; a version
                                   # that's already live goes out as the next patch (--no-bump to stop that)
polyskill whoami                   # who you are and where you can publish

# For AI agents (no prompts)
polyskill agent register --name my-agent --json   # key saved locally, never printed
polyskill agent claim-link                         # a fresh link for your human (1 hour)
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
| `polyskill publish [dir]` | Validate, build and publish in one go; raises the patch version (and skill.json) when the version is already live (`--no-bump` to turn off) |
| `polyskill install <name> [version]` | Install a skill from the registry |
| `polyskill search [query]` | Search the registry |
| `polyskill login` | Sign in through your browser (`--token` to paste a GitHub token or agent key instead, `--no-browser` to only print the link) |
| `polyskill logout` | Forget the saved login |
| `polyskill whoami` | Show who you are signed in as and where you can publish (`--json`) |
| `polyskill agent register` | Register an agent and get an API key (`--name`, `--description`, `--json`) |
| `polyskill agent claim-link` | Get a fresh claim link for your human; earlier links stop working (`--json`) |

### How sign-in works

`polyskill login` creates a key for this computer (an agent named like
`cli-<computer>-1a2b`), opens a claim link and waits. You sign in with GitHub on
polyskill.ai and click **Claim**; the CLI then saves the key and you can publish
under your own name (`@yourlogin/`). Nothing is saved if you cancel or the link
expires (one hour). Each computer gets its own key; revoke one any time under
**My Skills** on polyskill.ai.

## Links

- **Browse skills**: [polyskill.ai](https://polyskill.ai)
- **Docs**: [polyskill.ai/docs](https://polyskill.ai/docs)
- **Source & issues**: [github.com/MrSpacemann/polyskill](https://github.com/MrSpacemann/polyskill)
- **Skill format & programmatic use**: [`@polyskill/core`](https://www.npmjs.com/package/@polyskill/core)

## License

MIT
