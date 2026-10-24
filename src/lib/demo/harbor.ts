import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { applicableChecksPassed, runAllowlistedChecks } from "@/lib/checks/run";
import { generateRemediationPlan } from "@/lib/llm/plan";
import { applyPatchCopy, describePatchedRuntime, generateProposedPatch } from "@/lib/patches/generate";
import { buildSaplingClaim, buildSaplingEvidence, loadPolicy } from "@/lib/policy";
import { collectFromDisk } from "@/lib/repo/inventory";
import { missingEvidence } from "@/lib/repo/missing";
import { toVerificationRecord, verifyWithSapling, type SaplingCall } from "@/lib/sapling/client";
import { saveScan, type Scan } from "@/lib/store";

const FIXTURE_ROOT = path.join(process.cwd(), "fixtures", "repos", "legacy-billing-php");

export function createHarborScan(name = "Harbor Ledger — live demo"): Scan {
  const advisory = loadAdvisory("php-74-eol");
  const inventory = collectFromDisk(FIXTURE_ROOT, "fixture:legacy-billing-php");
  const evidence = [...inventory.evidence, ...missingEvidence(new Date().toISOString())];
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    repoSource: "fixture",
    repoLabel: "Harbor Ledger (PHP 7.4)",
    advisory,
    evidence,
    files: inventory.files,
    inspected: inventory.inspected,
    notInspected: inventory.notInspected,
    exposure: assessExposure(advisory, inventory.files, evidence),
    plan: null,
    planSource: null,
    planRequestId: null,
    patch: null,
    checks: [],
    verification: null,
    mubitCalls: [],
  };
}

export async function runHarborLedgerDemo(): Promise<{
  scan: Scan;
  legalCall: SaplingCall;
  evidenceText: string;
  claim: string;
}> {
  const scan = createHarborScan();
  const plan = await generateRemediationPlan(scan);
  scan.plan = plan.plan;
  scan.planSource = plan.source;
  scan.planRequestId = plan.requestId;
  scan.mubitCalls.push(...plan.calls);
  scan.patch = generateProposedPatch(scan);
  scan.checks = runAllowlistedChecks(scan);

  const policy = loadPolicy();
  const patched = describePatchedRuntime(applyPatchCopy(scan));
  const checksPassed = applicableChecksPassed(scan.checks);
  const claim = buildSaplingClaim({
    exposureStatus: scan.exposure.status,
    detectedVersion: scan.exposure.detectedVersion,
    patchedVersion: patched.docker ?? patched.phpVersion,
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
  const legalCall = await verifyWithSapling({
    policy: policy.text,
    evidence: evidenceText,
    claim,
  });
  scan.verification = toVerificationRecord(
    { policy: policy.text, evidence: evidenceText, claim },
    legalCall,
    scan.exposure.evidenceIds,
    scan.checks,
  );
  saveScan(scan);

  return { scan, legalCall, evidenceText, claim };
}
