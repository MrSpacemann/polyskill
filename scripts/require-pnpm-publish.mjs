// prepublishOnly guard for @polyskill/core and @polyskill/cli.
//
// Only `pnpm publish` rewrites `"@polyskill/core": "workspace:*"` to a real
// version. `npm publish` ships the literal `workspace:*`, and npm, npx and
// pnpm then all refuse to install the package (EUNSUPPORTEDPROTOCOL) — this
// is how @polyskill/cli@0.1.13 went out uninstallable on 2026-05-19.
const agent = process.env.npm_config_user_agent ?? "";

if (!agent.startsWith("pnpm/")) {
  const tool = agent.split(" ")[0] || "an unknown client";
  console.error(
    `\nRefusing to publish with ${tool}: it would ship "workspace:*" dependencies ` +
      `that make the package uninstallable.\nPublish with pnpm instead: pnpm publish --no-git-checks\n`
  );
  process.exit(1);
}
