import type { SaplingCall } from "@/lib/sapling/client";

export function saplingCard(claim: string, call: SaplingCall) {
  const parsed = call.parsed;
  return {
    claim,
    ok: call.ok,
    error: call.error,
    status: parsed?.status ?? null,
    rawLabel: parsed?.raw_label ?? null,
    probabilities: parsed?.probabilities ?? {},
    predictionSet: parsed?.prediction_set ?? parsed?.conformal_prediction_set ?? [],
    timingMs: parsed?.timing_ms && "model" in parsed.timing_ms ? parsed.timing_ms.model : null,
  };
}
