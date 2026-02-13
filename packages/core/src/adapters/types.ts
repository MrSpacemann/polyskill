import type { SkillDefinition, TranspileResult } from "../types.js";

/** Every platform adapter implements this interface */
export interface Adapter {
  readonly platform: string;
  transpile(skill: SkillDefinition): TranspileResult;
}
