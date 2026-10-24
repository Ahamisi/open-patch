export type PublicScan = {
  id: string;
  name: string;
  createdAt: string;
  repoSource: "fixture" | "upload" | "public_github";
  repoLabel: string;
  advisory: {
    id: string;
    title: string;
    kind: string;
    severity: string;
    severitySource: string;
    summary: string;
    component: string;
    affectedRange: string | null;
    remediation: string;
    references: { label: string; url: string }[];
  };
  evidence: {
    id: string;
    path: string;
    kind: string;
    excerpt: string;
    sha256: string;
    sourceLabel: string;
    confidence: string;
  }[];
  files: { path: string; bytes: number }[];
  inspected: string[];
  notInspected: string[];
  exposure: {
    status: "affected" | "not_affected" | "unknown";
    component: string;
    detectedVersion: string | null;
    affectedRange: string | null;
    reason: string;
    evidenceIds: string[];
    checks: { name: string; status: string; details: string; exitCode?: number; output?: string }[];
    limitations: string[];
  };
  plan: {
    summary: string;
    actions: {
      id: string;
      type: string;
      priority: string;
      description: string;
      files: string[];
      evidenceIds: string[];
      risk: string;
      rollback: string;
    }[];
    verificationSteps: string[];
    missingInformation: string[];
    humanApprovalRequired: true;
  } | null;
  planSource: "mubit" | "mock" | null;
  planRequestId: string | null;
  policyId?: string;
  policyVersion?: string;
  patch: {
    summary: string;
    unifiedDiff: string;
    hunks: {
      path: string;
      reason: string;
      evidenceIds: string[];
      before: string;
      after: string;
    }[];
    prTitle: string;
    prBody: string;
  } | null;
  checks: {
    name: string;
    status: string;
    details: string;
    exitCode?: number;
    command?: string;
    output?: string;
  }[];
  verification: {
    claim: string;
    policy: string;
    evidenceText?: string;
    evidenceIds: string[];
    saplingRawResponse: unknown;
    saplingVerdict: string | null;
    saplingScores: unknown;
    verificationStatus: string;
    deterministicChecks: { name: string; status: string; details: string }[];
    humanReviewStatus: string;
    limitations: string[];
  } | null;
  ecosystems: string[];
  advisoryEcosystem: string;
  readiness: {
    status: "review_ready" | "incomplete" | "no_change" | "investigation";
    reason: string;
    applicableFailed: string[];
    skipped: string[];
    pinsMoved: string[];
    humanApprovalRequired: true;
  };
  mubitCalls: {
    id: string;
    requestId: string | null;
    purpose: string;
    recordedForTraining: boolean;
    mock: boolean;
    model: string;
    createdAt: string;
    latencyMs: number;
    error: string | null;
  }[];
};

export type Correction = {
  id: string;
  runId: string;
  reviewerLabel: string;
  correctedOutput: string;
  policyVersion: string;
  mubitRequestId: string | null;
  createdAt: string;
};
