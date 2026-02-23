/**
 * Generates a SKILL.md file from a skill manifest and instructions.
 * Format: YAML frontmatter + verbatim instructions body.
 */

/** Wrap a value in double-quotes for safe YAML scalar emission. */
function yamlStr(value: string): string {
  return `"${value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")}"`;
}

/** @obra/superpowers → obra-superpowers */
export function toSlug(name: string): string {
  return name.replace(/^@/, "").replaceAll("/", "-");
}

export function generateSkillMd(manifest: any, instructions: string): string {
  // Scoped slug: "@obra/superpowers" → "obra-superpowers"
  const name = toSlug(manifest.name);
  const description = manifest.description ?? "";

  let frontmatter = `---\nname: ${yamlStr(name)}\ndescription: ${yamlStr(description)}`;

  if (manifest.keywords && manifest.keywords.length > 0) {
    frontmatter += `\nmetadata:\n  tags: [${manifest.keywords.map(yamlStr).join(", ")}]`;
  }

  frontmatter += "\n---";

  return `${frontmatter}\n\n${instructions}`;
}
