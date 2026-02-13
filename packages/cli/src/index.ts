#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { buildCommand } from "./commands/build.js";
import { publishCommand } from "./commands/publish.js";
import { installCommand } from "./commands/install.js";
import { searchCommand } from "./commands/search.js";

const program = new Command();

program
  .name("polyskill")
  .description("CLI for the PolySkill marketplace")
  .version("0.1.10");

program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(buildCommand);
program.addCommand(publishCommand);
program.addCommand(installCommand);
program.addCommand(searchCommand);

program.parse();
