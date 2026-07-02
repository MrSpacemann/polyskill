#!/usr/bin/env node
import { createRequire } from "node:module";
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { buildCommand } from "./commands/build.js";
import { publishCommand } from "./commands/publish.js";
import { installCommand } from "./commands/install.js";
import { searchCommand } from "./commands/search.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { agentCommand } from "./commands/agent.js";

// Single source of truth for the version — resolves to packages/cli/package.json
// from both src/ (tsx dev) and dist/ (published build).
const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
  .name("polyskill")
  .description("CLI for the PolySkill marketplace")
  .version(version);

program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(buildCommand);
program.addCommand(publishCommand);
program.addCommand(installCommand);
program.addCommand(searchCommand);
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(agentCommand);

await program.parseAsync();
