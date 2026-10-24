import {
  claimFromBaseline,
  evidenceFromBaseline,
  runBaselineMigration,
} from "@/lib/demo/baseline";
import { saplingCard } from "@/lib/demo/fight";
import { createHarborScan } from "@/lib/demo/harbor";
import { applicableChecksPassed, runAllowlistedChecks } from "@/lib/checks/run";
import { generateRemediationPlan } from "@/lib/llm/plan";
import { applyPatchCopy, describePatchedRuntime, generateProposedPatch } from "@/lib/patches/generate";
import { buildSaplingClaim, buildSaplingEvidence, loadPolicy } from "@/lib/policy";
import { publicScan } from "@/lib/public-scan";
import { toVerificationRecord, verifyWithSapling } from "@/lib/sapling/client";
import { saveScan } from "@/lib/store";

async function runBaselineOrExplain(scan: Parameters<typeof runBaselineMigration>[0]) {
  try {
    return await runBaselineMigration(scan);
  } catch (first) {
    try {
      return await runBaselineMigration(scan);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Baseline Mubit call failed";
      return {
        plan: { summary: message, claim: "", actions: [] },
        requestId: null,
        latencyMs: 0,
        raw: "",
        error: message,
      };
    }
  }
}

export async function POST() {
  const started = Date.now();
  const scan = createHarborScan("Harbor Ledger — live A/B");
  const policy = loadPolicy();

  const [baseline, legal] = await Promise.all([
    runBaselineOrExplain(scan),
    generateRemediationPlan(scan),
  ]);

  scan.plan = legal.plan;
  scan.planSource = legal.source;
  scan.planRequestId = legal.requestId;
  scan.mubitCalls.push(...legal.calls);
  scan.patch = generateProposedPatch(scan);
  scan.checks = runAllowlistedChecks(scan);

  const patched = describePatchedRuntime(applyPatchCopy(scan));
  const legalClaim = buildSaplingClaim({
    exposureStatus: scan.exposure.status,
    detectedVersion: scan.exposure.detectedVersion,
    patchedVersion: patched.docker ?? patched.phpVersion,
    checksPassed: applicableChecksPassed(scan.checks),
    checksRun: true,
  });
  const legalEvidence = buildSaplingEvidence([
    `Advisory: ${scan.advisory.title}. Affected range: ${scan.advisory.affectedRange}.`,
    `Deterministic exposure: ${scan.exposure.status}. ${scan.exposure.reason}`,
    `Detected runtime pin: ${scan.exposure.detectedVersion}.`,
    `Proposed pins: Dockerfile=${patched.docker}, composer=${patched.composer}, .php-version=${patched.phpVersion}, CI=${patched.ci}.`,
    `Allowlisted checks: ${scan.checks.map((check) => `${check.name}=${check.status}`).join("; ")}.`,
    `Policy version ${policy.version}.`,
  ]);
  const naiveClaim = claimFromBaseline(baseline.plan, scan.exposure.detectedVersion);
  const naiveEvidence = evidenceFromBaseline({
    detectedVersion: scan.exposure.detectedVersion,
    plan: baseline.plan,
  });

  const [illegalCall, legalCall] = await Promise.all([
    verifyWithSapling({ policy: policy.text, evidence: naiveEvidence, claim: naiveClaim }),
    verifyWithSapling({ policy: policy.text, evidence: legalEvidence, claim: legalClaim }),
  ]);

  scan.verification = toVerificationRecord(
    { policy: policy.text, evidence: legalEvidence, claim: legalClaim },
    legalCall,
    scan.exposure.evidenceIds,
    scan.checks,
  );
  saveScan(scan);

  return Response.json({
    elapsedMs: Date.now() - started,
    scan: publicScan(scan),
    naive: {
      live: true,
      requestId: baseline.requestId,
      latencyMs: baseline.latencyMs,
      error: baseline.error,
      plan: {
        label: "Plain frontier route",
        subtitle: "Same gpt-6-luna · engineer prompt · not stored on plan 3",
        summary: baseline.plan.summary,
        actions: baseline.plan.actions,
      },
      sapling: saplingCard(naiveClaim, illegalCall),
    },
    legal: {
      planSource: scan.planSource,
      requestId: scan.planRequestId,
      sapling: saplingCard(legalClaim, legalCall),
    },
  });
}
