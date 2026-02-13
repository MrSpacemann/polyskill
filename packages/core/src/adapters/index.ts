import type { Adapter } from "./types.js";
import { openaiAdapter } from "./openai.js";
import { anthropicAdapter } from "./anthropic.js";
import { grokAdapter } from "./grok.js";
import { geminiAdapter } from "./gemini.js";
import { kimiAdapter } from "./kimi.js";

export type { Adapter } from "./types.js";
export { openaiAdapter } from "./openai.js";
export { anthropicAdapter } from "./anthropic.js";
export { grokAdapter } from "./grok.js";
export { geminiAdapter } from "./gemini.js";
export { kimiAdapter } from "./kimi.js";

/** Registry of all built-in adapters, keyed by platform name */
const adapterRegistry: Record<string, Adapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  grok: grokAdapter,
  gemini: geminiAdapter,
  kimi: kimiAdapter,
};

/** Get an adapter by platform name. Returns undefined if not found. */
export function getAdapter(platform: string): Adapter | undefined {
  return adapterRegistry[platform];
}

/** List all registered platform names */
export function listAdapters(): string[] {
  return Object.keys(adapterRegistry);
}
