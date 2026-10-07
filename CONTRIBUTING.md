# Contributing to PolySkill

Thanks for your interest in contributing to PolySkill!

## Development Setup

1. **Prerequisites**: Node.js >= 20 (the CLI itself runs on >= 18), pnpm
2. **Clone the repo**:
   ```bash
   git clone https://github.com/MrSpacemann/polyskill.git
   cd polyskill
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Build all packages**:
   ```bash
   pnpm build
   ```
5. **Run tests**:
   ```bash
   pnpm test
   ```

## Project Structure

```
packages/
  core/   Skill spec, validation, adapter transpilation (@polyskill/core)
  cli/    Developer CLI — init, validate, build, publish, install, search (@polyskill/cli)
skills/   Example skills
```

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm build && pnpm test` to verify nothing is broken
4. Submit a pull request

## Code Style

- TypeScript with strict mode
- ESM modules (`"type": "module"`)
- Keep things simple — avoid unnecessary abstractions

## Submitting a Pull Request

- Keep PRs focused on a single change
- Include a clear description of what and why
- Make sure all tests pass
- Add tests for new functionality

## Publishing to npm (Maintainers)

Both `@polyskill/core` and `@polyskill/cli` are published to npm. Always use `pnpm publish` (not `npm publish`) — it resolves `workspace:*` dependencies to concrete versions automatically. A `prepublishOnly` guard refuses `npm publish`: `@polyskill/cli@0.1.13` went out with a literal `workspace:*` dependency and could not be installed by anyone.

```bash
# 1. Bump version in the package's package.json (the CLI reads its version from there at runtime).
#    If the CLI needs unreleased core changes, bump core too — the CLI pins core's exact version.
# 2. Build and test
pnpm build && pnpm test

# 3. Publish core first, then the CLI (from the repo root)
(cd packages/core && pnpm publish --no-git-checks)
(cd packages/cli && pnpm publish --no-git-checks)

# 4. Verify what users get — from OUTSIDE the repo, where the workspace can't paper over a broken package
#    Name the exact new version and override any min-release-age cooldown in ~/.npmrc: under a
#    cooldown, npm 11 silently resolves `@latest` to an OLDER version, so the check would test
#    the wrong release. It should print the version you just published.
cd /tmp && npx -y --min-release-age=0 @polyskill/cli@<new-version> --version
#    (or run the "Published CLI smoke test" workflow in GitHub Actions — runners have no cooldown)

# 5. Commit, tag, push
```

If you change core, publish core first, then bump the server's dependency in the private repo.

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
