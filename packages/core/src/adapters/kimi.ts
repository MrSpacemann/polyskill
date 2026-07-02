import { openaiCompatibleAdapter } from "./openai-compatible.js";

/** Kimi (Moonshot) uses the OpenAI-compatible function-calling format */
export const kimiAdapter = openaiCompatibleAdapter("kimi");
