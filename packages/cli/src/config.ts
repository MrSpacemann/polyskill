/** Default registry URL — overridable via POLYSKILL_REGISTRY env var */
export const REGISTRY_URL =
  process.env.POLYSKILL_REGISTRY || process.env.SKILLSTORE_REGISTRY || "https://polyskill.ai";
