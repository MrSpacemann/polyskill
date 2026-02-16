import { Command } from "commander";
import chalk from "chalk";
import { clearToken } from "../auth.js";

export const logoutCommand = new Command("logout")
  .description("Remove stored authentication token")
  .action(() => {
    clearToken();
    console.log(chalk.green("\nLogged out successfully.\n"));
  });
