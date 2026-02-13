# Contributing to PolySkill

Thanks for your interest in contributing to PolySkill!

## Development Setup

1. **Prerequisites**: Node.js >= 18, pnpm
2. **Clone the repo**:
   ```bash
   git clone https://github.com/FrederikJensen/polyskill.git
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

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
