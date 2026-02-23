/**
 * Generates a SKILL.md file from a skill manifest and instructions.
 * Format: YAML frontmatter + verbatim instructions body.
 */
export function generateSkillMd(manifest: any, instructions: string): string {
  // Last path segment: "@obra/superpowers" → "superpowers"
  const name = manifest.name.split("/").at(-1)!;
  const description = manifest.description ?? "";

  let frontmatter = `---\nname: ${name}\ndescription: ${description}`;

  if (manifest.keywords && manifest.keywords.length > 0) {
    frontmatter += `\nmetadata:\n  tags: ${manifest.keywords.join(", ")}`;
  }

  frontmatter += "\n---";

  return `${frontmatter}\n\n${instructions}`;
}
