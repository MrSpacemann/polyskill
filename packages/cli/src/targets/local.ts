import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";

/**
 * Local target — writes skill files to ./skills/<scoped-name>/ relative to outputDir.
 * Preserves existing behavior exactly (uses @ and __ in directory names).
 */
export const localTarget = {
  name: "local",
  dir: "./skills/",

  async write(skill: any, outputDir: string): Promise<void> {
    // Keep @ and replace / with __ (e.g. @author/skill → @author__skill).
    // The @ is intentionally preserved to match the original install behavior.
    const skillDir = join(outputDir, "skills", skill.name.replaceAll("/", "__"));
    await mkdir(skillDir, { recursive: true });

    // Write manifest
    await writeFile(
      join(skillDir, "skill.json"),
      JSON.stringify(skill.manifest, null, 2)
    );

    // Write tools if present
    if (skill.tools) {
      await writeFile(
        join(skillDir, "tools.json"),
        JSON.stringify(skill.tools, null, 2)
      );
    }

    // Write instructions if present
    if (skill.instructions) {
      await writeFile(join(skillDir, "instructions.md"), skill.instructions);
    }

    // Write adapter outputs
    const adapterEntries =
      skill.adapters && typeof skill.adapters === "object"
        ? Object.entries(skill.adapters)
        : [];
    if (adapterEntries.length > 0) {
      const distDir = join(skillDir, "dist");
      await mkdir(distDir, { recursive: true });

      for (const [platform, output] of adapterEntries) {
        await writeFile(
          join(distDir, `${platform}.json`),
          JSON.stringify(output, null, 2)
        );
      }
    }

    console.log(chalk.dim(`  Location: ${skillDir}`));
  },
};
