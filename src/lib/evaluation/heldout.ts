import { readFileSync } from "node:fs";
import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { POLICY_VERSION } from "@/lib/config";
import { callMubitTaskRaw } from "@/lib/llm/mubit";
import { remediationPlanSchema } from "@/lib/schemas";
import type { EvalRun } from "@/lib/store";

type HeldOutCase = {
  id: string;
  advisoryId: string;
  detectedPhp: string | null;
  imagickPresent?: boolean;
  osEstablished?: boolean;
  expectedStatus: "affected" | "not_affected" | "unknown";
  expectedActionTypes: string[];
  forbiddenActionTypes?: string[];
};

type HeldOutFile = { cases: HeldOutCase[] };

export function loadHeldOutCases(): HeldOutCase[] {
  const file = path.join(process.cwd(), "fixtures", "eval", "heldout.json");
  return (JSON.parse(readFileSync(file, "utf8")) as HeldOutFile).cases;
}

export async function runHeldOutEvaluation(): Promise<EvalRun> {
  const cases = loadHeldOutCases();
  const results = [];

  for (const item of cases) {
    const started = Date.now();
    const advisory = loadAdvisory(item.advisoryId);
    const userContent = JSON.stringify(
      {
        policyVersion: POLICY_VERSION,
        split: "heldout",
        advisory,
        exposure: {
          status: item.expectedStatus,
          component: advisory.component,
          detectedVersion: item.detectedPhp,
          affectedRange: advisory.affectedRange,
          reason: "Held-out fixture. Do not use as a training example.",
          evidenceIds: item.detectedPhp ? ["ev-eval-001"] : [],
          limitations: ["Held-out evaluation case."],
        },
        evidence: item.detectedPhp
          ? [
              {
                id: "ev-eval-001",
                path: ".php-version",
                kind: "runtime_config",
                confidence: "confirmed",
                excerpt: item.detectedPhp,
              },
            ]
          : [],
      },
      null,
      2,
    );

    try {
      const call = await callMubitTaskRaw({
        purpose: "heldout_eval",
        userContent,
        recordForTraining: false,
        sessionId: `heldout-${item.id}`,
      });
      const parsed = remediationPlanSchema.safeParse(JSON.parse(call.content || "{}"));
      const types = parsed.success ? parsed.data.actions.map((action) => action.type) : [];
      const requiredHits = item.expectedActionTypes.filter((type) =>
        (types as string[]).includes(type),
      );
      const forbiddenHit = (item.forbiddenActionTypes ?? []).some((type) =>
        (types as string[]).includes(type),
      );
      const evidenceIds = parsed.success
        ? parsed.data.actions.flatMap((action) => action.evidenceIds)
        : [];
      const evidenceIdsValid = evidenceIds.every((id) => id === "ev-eval-001" || item.detectedPhp === null);

      results.push({
        caseId: item.id,
        schemaValid: parsed.success,
        evidenceIdsValid,
        requiredActionRecall:
          item.expectedActionTypes.length === 0
            ? 1
            : requiredHits.length / item.expectedActionTypes.length,
        unsupportedClaim: forbiddenHit || !evidenceIdsValid,
        latencyMs: Date.now() - started,
        mubitRequestId: call.record.requestId,
        error: null,
      });
    } catch (error) {
      results.push({
        caseId: item.id,
        schemaValid: false,
        evidenceIdsValid: false,
        requiredActionRecall: 0,
        unsupportedClaim: true,
        latencyMs: Date.now() - started,
        mubitRequestId: null,
        error: error instanceof Error ? error.message : "eval failed",
      });
    }
  }

  return {
    id: `eval_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    recordedForTraining: false,
    results,
    note: "Held-out calls were sent with x-middleware-store: false so they are not kept as training examples. A passing Mubit adapter is not claimed here.",
  };
}
