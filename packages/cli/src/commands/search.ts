/*
 * Search flow state machine:
 *
 * FETCH_REGISTRY ──→ FORMAT_OUTPUT ──→ PRINT ──→ EXIT(0)
 *        │
 *        ├──→ HTTP_ERR (4xx / 5xx)
 *        │
 *        ▼
 *   NETWORK_ERR (DNS / timeout / refused)
 */

import { Command } from "commander";
import chalk from "chalk";
import { REGISTRY_URL } from "../config.js";

interface SkillResult {
  name: string;
  version: string;
  description: string;
  type: string;
  author_name: string;
  verified: boolean;
  downloads: number;
  category: string | null;
}

interface SearchResponse {
  skills: SkillResult[];
  total: number;
}

export const searchCommand = new Command("search")
  .description("Search for skills in the PolySkill registry")
  .argument("[query]", "Search query (matches name, description, keywords)")
  .option("--type <type>", "Filter by skill type (prompt, tool, workflow, composite)")
  .option("--verified", "Only show verified skills")
  .option("--author <name>", "Filter by author name")
  .option("--keyword <keyword>", "Filter by keyword")
  .option("--category <category>", "Filter by category (e.g. coding-data, productivity, automation)")
  .option("--sort <sort>", "Sort results (relevance, downloads, name, recent)")
  .option("--limit <n>", "Max results (default 20)", "20")
  .option("--json", "Output raw JSON (for programmatic use)")
  .option("--registry <url>", "Registry URL", REGISTRY_URL)
  .action(
    async (
      query: string | undefined,
      options: {
        type?: string;
        verified?: boolean;
        author?: string;
        keyword?: string;
        category?: string;
        sort?: string;
        limit: string;
        json?: boolean;
        registry: string;
      }
    ) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (options.type) params.set("type", options.type);
      if (options.verified) params.set("verified", "true");
      if (options.author) params.set("author", options.author);
      if (options.keyword) params.set("keyword", options.keyword);
      if (options.category) params.set("category", options.category);
      if (options.sort) params.set("sort", options.sort);
      params.set("limit", options.limit);

      const url = `${options.registry}/api/skills?${params}`;

      let res: Response;
      try {
        res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      } catch (err: any) {
        const msg =
          err.name === "TimeoutError"
            ? "Request timed out — is the registry running?"
            : `Network error: ${err.message}`;
        console.log(chalk.red(`\n${msg}\n`));
        process.exit(1);
      }

      if (!res.ok) {
        console.log(chalk.red(`\nSearch failed: ${res.statusText}\n`));
        process.exit(1);
      }

      const data = (await res.json()) as SearchResponse;

      // JSON mode: dump raw response and exit
      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      // No results
      if (data.skills.length === 0) {
        console.log(
          chalk.yellow(`\nNo skills found${query ? ` for "${query}"` : ""}\n`)
        );
        return;
      }

      // Print results
      console.log();
      for (const skill of data.skills) {
        const badge = skill.verified
          ? chalk.green("[verified]")
          : chalk.yellow("[unverified]");
        const typeTag = chalk.dim(skill.type);
        const catTag = skill.category ? chalk.dim(`[${skill.category}]`) : "";

        console.log(`${chalk.bold(skill.name)} ${chalk.dim(`v${skill.version}`)} ${badge} ${typeTag} ${catTag}`.trimEnd());
        console.log(`  ${skill.description}`);
        console.log(chalk.cyan(`  → polyskill install ${skill.name}`));
        console.log();
      }

      const showing = data.skills.length;
      const suffix = query ? ` matching "${query}"` : "";
      if (data.total > showing) {
        console.log(chalk.dim(`Showing ${showing} of ${data.total} skills${suffix}\n`));
      } else {
        console.log(chalk.dim(`${data.total} skill${data.total === 1 ? "" : "s"} found${suffix}\n`));
      }
    }
  );
