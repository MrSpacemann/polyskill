const SKILL_NAME_RE = /^@([a-z0-9-]+)\/([a-z0-9-]+)$/;

/** `@scope/name` -> `@polyskill/scope.name` (injective; `.` illegal in
 *  polyskill names, legal in npm scoped package names). */
export function npmName(skillName: string): string {
  const m = skillName.match(SKILL_NAME_RE);
  if (!m) throw new Error(`Invalid skill name: ${skillName}`);
  return `@polyskill/${m[1]}.${m[2]}`;
}
