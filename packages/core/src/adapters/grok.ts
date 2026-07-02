import { openaiCompatibleAdapter } from "./openai-compatible.js";

/** Grok (xAI) uses the OpenAI-compatible function-calling format */
export const grokAdapter = openaiCompatibleAdapter("grok");
