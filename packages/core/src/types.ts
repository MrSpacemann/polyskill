/** Skill type categories */
export type SkillType = "prompt" | "tool" | "workflow" | "composite";

/** Author metadata */
export interface SkillAuthor {
  name: string;
  email?: string;
  url?: string;
}

/** Skill file references within the manifest */
export interface SkillFiles {
  instructions?: string;
  tools?: string;
  examples?: string;
}

/** The skill.json manifest — the root config for every Skill package */
export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  type: SkillType;
  license: string;
  author: SkillAuthor;
  main?: string;
  skill: SkillFiles;
  adapters: string[];
  dependencies?: Record<string, string>;
  keywords?: string[];
  repository?: string;
  evals?: string;
  category?: string;
}

/** JSON Schema property definition (subset we care about) */
export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** Parameter schema for a tool — standard JSON Schema object */
export interface ToolParameterSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** A single canonical tool definition */
export interface CanonicalTool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  returns?: JsonSchemaProperty;
}

/** The tools.json file structure */
export interface ToolsFile {
  tools: CanonicalTool[];
}

/** A fully loaded and resolved Skill — ready for adapter transpilation */
export interface SkillDefinition {
  manifest: SkillManifest;
  tools: CanonicalTool[];
  instructions: string | null;
}

/** Result from an adapter transpilation */
export interface TranspileResult {
  platform: string;
  systemPrompt: string | null;
  tools: unknown[];
}
