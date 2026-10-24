import { applicableChecksPassed } from "@/lib/checks/run";
import { publicScan } from "@/lib/public-scan";
import { describePatchedRuntime, applyPatchCopy } from "@/lib/patches/generate";
import { buildSaplingClaim, buildSaplingEvidence, loadPolicy } from "@/lib/policy";
import { toVerificationRecord, verifyWithSapling } from "@/lib/sapling/client";
import { getScan, saveScan } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });

  const policy = loadPolicy(scan.policyId);
  const patched = scan.patch ? describePatchedRuntime(applyPatchCopy(scan)) : null;
  const checksRun = scan.checks.length > 0;
  const checksPassed = applicableChecksPassed(scan.checks);

  const claim = buildSaplingClaim({
    exposureStatus: scan.exposure.status,
    detectedVersion: scan.exposure.detectedVersion,
    patchedVersion: patched?.docker ?? patched?.phpVersion ?? null,
    checksPassed,
    checksRun,
  });

  const evidence = buildSaplingEvidence([
    `Advisory: ${scan.advisory.title}. Affected range: ${scan.advisory.affectedRange ?? "unspecified"}.`,
    `Deterministic exposure: ${scan.exposure.status}. ${scan.exposure.reason}`,
    `Detected runtime pin: ${scan.exposure.detectedVersion ?? "not established"}.`,
    patched
      ? `Proposed pins after patch: Dockerfile=${patched.docker ?? "n/a"}, composer=${patched.composer ?? "n/a"}, .php-version=${patched.phpVersion ?? "n/a"}, CI=${patched.ci ?? "n/a"}.`
      : "No patch has been generated.",
    checksRun
      ? `Allowlisted checks: ${scan.checks.map((check) => `${check.name}=${check.status}`).join("; ")}.`
      : "Allowlisted checks have not been run.",
    `Policy version ${policy.version}.`,
  ]);

  const call = await verifyWithSapling({
    policy: policy.text,
    evidence,
    claim,
  });

  scan.verification = toVerificationRecord(
    { policy: policy.text, evidence, claim },
    call,
    scan.exposure.evidenceIds,
    scan.checks,
  );
  saveScan(scan);

  return Response.json({
    scan: publicScan(scan),
    sapling: {
      ok: call.ok,
      error: call.error,
      raw: call.raw,
    },
  });
}
