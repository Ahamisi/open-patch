import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { applicableChecksPassed, runAllowlistedChecks } from "@/lib/checks/run";
import { generateRemediationPlan } from "@/lib/llm/plan";
import { generateProposedPatch, applyPatchCopy, describePatchedRuntime } from "@/lib/patches/generate";
import { buildSaplingClaim, buildSaplingEvidence, loadPolicy } from "@/lib/policy";
import { publicScan } from "@/lib/public-scan";
import { collectFromDisk } from "@/lib/repo/inventory";
import { missingEvidence } from "@/lib/repo/missing";
import { toVerificationRecord, verifyWithSapling } from "@/lib/sapling/client";
import { saveScan, type Scan } from "@/lib/store";

const FIXTURE_ROOT = path.join(process.cwd(), "fixtures", "repos", "legacy-billing-php");

export async function POST() {
  const started = Date.now();
  const advisory = loadAdvisory("php-74-eol");
  const inventory = collectFromDisk(FIXTURE_ROOT, "fixture:legacy-billing-php");
  const evidence = [...inventory.evidence, ...missingEvidence(new Date().toISOString())];
  const scan: Scan = {
    id: crypto.randomUUID(),
    name: "Harbor Ledger — live demo",
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
    `Advisory: ${advisory.title}. Affected range: ${advisory.affectedRange}.`,
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

  return Response.json({
    scan: publicScan(scan),
    elapsedMs: Date.now() - started,
    mubit: {
      source: plan.source,
      requestId: plan.requestId,
    },
    sapling: {
      verdict: scan.verification.saplingVerdict,
      status: scan.verification.verificationStatus,
    },
  });
}
