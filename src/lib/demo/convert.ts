import { applicableChecksPassed, runAllowlistedChecks } from "@/lib/checks/run";
import { generateRemediationPlan } from "@/lib/llm/plan";
import { applyPatchCopy, describePatchedRuntime, generateProposedPatch } from "@/lib/patches/generate";
import { buildSaplingClaim, buildSaplingEvidence, loadPolicy } from "@/lib/policy";
import { toVerificationRecord, verifyWithSapling } from "@/lib/sapling/client";
import { saveScan, type Scan } from "@/lib/store";

/** Plan, pin patch, checks, and Sapling — the conversion a team sees after they drop a ZIP. */
export async function completeConversion(scan: Scan): Promise<Scan> {
  const plan = await generateRemediationPlan(scan);
  scan.plan = plan.plan;
  scan.planSource = plan.source;
  scan.planRequestId = plan.requestId;
  scan.mubitCalls.push(...plan.calls);
  scan.patch = generateProposedPatch(scan);
  scan.checks = runAllowlistedChecks(scan);

  const policy = loadPolicy(scan.policyId);
  const patched = describePatchedRuntime(applyPatchCopy(scan));
  const checksPassed = applicableChecksPassed(scan.checks);
  const claim = buildSaplingClaim({
    exposureStatus: scan.exposure.status,
    detectedVersion: scan.exposure.detectedVersion,
    patchedVersion:
      patched.docker ?? patched.phpVersion ?? patched.nodeFile ?? patched.pythonFile,
    checksPassed,
    checksRun: true,
  });
  const evidenceText = buildSaplingEvidence([
    `Advisory: ${scan.advisory.title}. Affected range: ${scan.advisory.affectedRange}.`,
    `Deterministic exposure: ${scan.exposure.status}. ${scan.exposure.reason}`,
    `Detected runtime pin: ${scan.exposure.detectedVersion}.`,
    `Proposed pins: Dockerfile=${patched.docker}, composer=${patched.composer}, .php-version=${patched.phpVersion}, CI=${patched.ci}.`,
    `Allowlisted checks: ${scan.checks.map((check) => `${check.name}=${check.status}`).join("; ")}.`,
    `Policy version ${policy.version}.`,
  ]);
  const sapling = await verifyWithSapling({
    policy: policy.text,
    evidence: evidenceText,
    claim,
  });
  scan.verification = toVerificationRecord(
    { policy: policy.text, evidence: evidenceText, claim },
    sapling,
    scan.exposure.evidenceIds,
    scan.checks,
  );
  saveScan(scan);
  return scan;
}
