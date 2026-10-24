import { applicableChecks, applicableChecksPassed } from "@/lib/checks/run";
import type { CheckResult } from "@/lib/schemas";
import type { Scan } from "@/lib/store";

export type ReadinessStatus = "review_ready" | "incomplete" | "no_change" | "investigation";

export type RemediationReadiness = {
  status: ReadinessStatus;
  reason: string;
  applicableFailed: string[];
  skipped: string[];
  pinsMoved: string[];
  humanApprovalRequired: true;
};

export function assessRemediationReadiness(
  scan: Pick<Scan, "exposure" | "patch" | "checks">,
): RemediationReadiness {
  const pinsMoved = scan.patch?.hunks.map((hunk) => hunk.path) ?? [];
  const skipped = scan.checks.filter((check) => check.status === "not_run").map((check) => check.name);
  const applicableFailed = scan.checks
    .filter((check) => check.status === "fail")
    .map((check) => check.name);

  if (scan.exposure.status === "unknown") {
    return {
      status: "investigation",
      reason:
        "Exposure is unknown. Collect the missing runtime or OS evidence before claiming a fix.",
      applicableFailed,
      skipped,
      pinsMoved,
      humanApprovalRequired: true,
    };
  }

  if (scan.exposure.status === "not_affected") {
    return {
      status: "no_change",
      reason: "Repository evidence is outside the advisory range. No remediation change is proposed.",
      applicableFailed,
      skipped,
      pinsMoved,
      humanApprovalRequired: true,
    };
  }

  if (!scan.patch || scan.patch.hunks.length === 0) {
    return {
      status: "no_change",
      reason:
        "Affected, but no rewriteable runtime pin was found. Open Patch will not invent a source edit.",
      applicableFailed,
      skipped,
      pinsMoved,
      humanApprovalRequired: true,
    };
  }

  if (scan.checks.length === 0) {
    return {
      status: "incomplete",
      reason: "A patch exists. Run the allowlisted checks before calling this review-ready.",
      applicableFailed,
      skipped,
      pinsMoved,
      humanApprovalRequired: true,
    };
  }

  if (!applicableChecksPassed(scan.checks)) {
    return {
      status: "incomplete",
      reason:
        applicableFailed.length > 0
          ? `Applicable checks still failing: ${applicableFailed.join(", ")}.`
          : "No applicable pin checks have passed yet.",
      applicableFailed,
      skipped,
      pinsMoved,
      humanApprovalRequired: true,
    };
  }

  return {
    status: "review_ready",
    reason: `${pinsMoved.length} runtime pin${pinsMoved.length === 1 ? "" : "s"} moved to PHP 8.2 and the checks that apply passed. A human still has to approve. Open Patch does not merge.`,
    applicableFailed,
    skipped,
    pinsMoved,
    humanApprovalRequired: true,
  };
}

export function readinessFromChecks(checks: CheckResult[]): boolean {
  return applicableChecksPassed(checks);
}
