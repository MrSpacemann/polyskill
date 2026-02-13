# Contributing to PolySkill

Thanks for your interest in contributing to PolySkill!

## Development Setup

1. **Prerequisites**: Node.js >= 18, pnpm
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

Both `@polyskill/core` and `@polyskill/cli` are published to npm. Always use `pnpm publish` (not `npm publish`) — it resolves `workspace:*` dependencies to concrete versions automatically.

```bash
# 1. Bump version in package.json AND src/index.ts (CLI has a hardcoded .version() call)
# 2. Build and test
pnpm build && pnpm test

# 3. Publish (from the package directory)
cd packages/core && pnpm publish --no-git-checks
cd packages/cli && pnpm publish --no-git-checks

# 4. Commit, tag, push
```

If you change core, publish core first, then bump the server's dependency in the private repo.

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
