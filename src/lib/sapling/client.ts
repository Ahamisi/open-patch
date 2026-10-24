import { BANYAN_SAPLING_TOKEN, BANYAN_SAPLING_URL } from "@/lib/config";
import {
  saplingResponseSchema,
  type CheckResult,
  type SaplingResponse,
  type VerificationRecord,
} from "@/lib/schemas";

const TIMEOUT_MS = 20_000;

export type SaplingRequest = {
  policy: string;
  evidence: string;
  claim: string;
};

export type SaplingCall = {
  ok: boolean;
  raw: unknown;
  parsed: SaplingResponse | null;
  error: string | null;
};

/**
 * Live Hugging Face Inference Endpoint contract (confirmed 2026-10-24):
 * POST $BANYAN_SAPLING_URL
 * body: { inputs: { policy, evidence, claim } }
 * The handler also accepts the three fields at the top level after unwrap,
 * but the gateway requires the `inputs` key.
 */
export async function verifyWithSapling(request: SaplingRequest): Promise<SaplingCall> {
  if (!request.policy.trim() || !request.evidence.trim() || !request.claim.trim()) {
    return {
      ok: false,
      raw: null,
      parsed: null,
      error: "policy, evidence, and claim must be nonempty strings.",
    };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BANYAN_SAPLING_TOKEN) {
    headers.Authorization = `Bearer ${BANYAN_SAPLING_TOKEN}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(BANYAN_SAPLING_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: {
          policy: request.policy,
          evidence: request.evidence,
          claim: request.claim,
        },
      }),
      signal: controller.signal,
    });
    const raw = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        raw,
        parsed: null,
        error: `Sapling HTTP ${response.status}`,
      };
    }
    const parsed = saplingResponseSchema.safeParse(raw);
    return {
      ok: true,
      raw,
      parsed: parsed.success ? parsed.data : (raw as SaplingResponse),
      error: parsed.success ? null : "Raw Sapling payload retained; some fields were not in the known schema.",
    };
  } catch (error) {
    return {
      ok: false,
      raw: null,
      parsed: null,
      error: error instanceof Error ? error.message : "Sapling request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function toVerificationRecord(
  request: SaplingRequest,
  call: SaplingCall,
  evidenceIds: string[],
  deterministicChecks: CheckResult[],
): VerificationRecord {
  if (!call.ok || !call.parsed) {
    return {
      claim: request.claim,
      policy: request.policy,
      evidenceText: request.evidence,
      evidenceIds,
      saplingRawResponse: call.raw,
      saplingVerdict: null,
      saplingScores: null,
      verificationStatus: "unavailable",
      deterministicChecks,
      humanReviewStatus: "pending",
      limitations: [
        call.error ?? "Banyan Sapling was unavailable.",
        "Deterministic checks are the only automated signal until Sapling responds.",
      ],
    };
  }

  const status = call.parsed.status ?? null;
  const verificationStatus =
    status === "supported"
      ? "verified"
      : status === "violation"
        ? "contradicted"
        : status === "unsure" ||
            status === "insufficient_information" ||
            status === "inconsistent_context"
          ? "uncertain"
          : "uncertain";

  return {
    claim: request.claim,
    policy: request.policy,
    evidenceText: request.evidence,
    evidenceIds,
    saplingRawResponse: call.raw,
    saplingVerdict: status ?? call.parsed.raw_label ?? null,
    saplingScores: {
      raw_label: call.parsed.raw_label ?? null,
      status,
      probabilities: call.parsed.probabilities ?? null,
      prediction_set: call.parsed.prediction_set ?? null,
      conformal_prediction_set: call.parsed.conformal_prediction_set ?? null,
      logits: call.parsed.logits ?? null,
      status_provenance: call.parsed.status_provenance ?? null,
      conformal_singleton: call.parsed.conformal_singleton ?? null,
      fallback_used: call.parsed.fallback_used ?? null,
      timing_ms: call.parsed.timing_ms ?? null,
    },
    verificationStatus,
    deterministicChecks,
    humanReviewStatus: "pending",
    limitations: [
      "Sapling classifies the supplied text only. It is not a repository scanner or exploit proof.",
      "An unsure or multi-label prediction set is left uncertain and is not converted to pass.",
      "A high raw probability is not proof of production safety.",
    ],
  };
}

export async function saplingHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await fetch(BANYAN_SAPLING_URL.replace(/\/$/, "") + "/health", {
      method: "GET",
    });
    const text = await response.text();
    return { ok: response.ok, detail: text.slice(0, 80) };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "unreachable",
    };
  }
}
