export const MUBIT_BASE_URL =
  process.env.MUBIT_BASE_URL ?? "https://api.mubit.ai/openai/v1";
export const MUBIT_MODEL =
  process.env.MUBIT_MODEL ?? process.env.FIXONCE_MODEL ?? "gpt-6-luna";
export const MUBIT_API_KEY = process.env.MUBIT_API_KEY ?? "";
export const BANYAN_SAPLING_URL =
  process.env.BANYAN_SAPLING_URL ??
  "https://6adbee0669a00298cd4774c9.endpoints.huggingface.cloud";
export const BANYAN_SAPLING_TOKEN =
  process.env.BANYAN_SAPLING_TOKEN ?? "";

export const POLICY_VERSION = "SEC-RUNTIME-01@2026-10-24";
export const TASK_NAME = "advisory_to_migration_plan";

export const ZIP_LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  maxFiles: 250,
  maxFileBytes: 200 * 1024,
  maxDepth: 8,
  maxExcerpt: 1200,
};

export function mubitConfigured(): boolean {
  return MUBIT_API_KEY.startsWith("mbt_");
}
