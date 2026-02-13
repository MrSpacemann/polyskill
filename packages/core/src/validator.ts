import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));

const manifestSchema = JSON.parse(
  readFileSync(join(__dirname, "schema", "skill-manifest.schema.json"), "utf-8")
);
const toolsSchema = JSON.parse(
  readFileSync(join(__dirname, "schema", "tool-definition.schema.json"), "utf-8")
);

// Handle CJS/ESM interop for ajv and ajv-formats
const AjvConstructor = (Ajv as any).default ?? Ajv;
const addFormatsPlugin = (addFormats as any).default ?? addFormats;

const ajv = new AjvConstructor({ allErrors: true });
addFormatsPlugin(ajv);

const validateManifestSchema = ajv.compile(manifestSchema);
const validateToolsSchema = ajv.compile(toolsSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a skill.json manifest object */
export function validateManifest(data: unknown): ValidationResult {
  const valid = validateManifestSchema(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = (validateManifestSchema.errors ?? []).map(
    (e: { instancePath?: string; message?: string }) =>
      `${e.instancePath || "/"}: ${e.message}`
  );
  return { valid: false, errors };
}

/** Validate a tools.json file object */
export function validateTools(data: unknown): ValidationResult {
  const valid = validateToolsSchema(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = (validateToolsSchema.errors ?? []).map(
    (e: { instancePath?: string; message?: string }) =>
      `${e.instancePath || "/"}: ${e.message}`
  );
  return { valid: false, errors };
}
