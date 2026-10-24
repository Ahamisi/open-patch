import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  CheckResult,
  CorrectionRecord,
  ExposureAssessment,
  RemediationPlan,
  RepositoryEvidence,
  VerificationRecord,
} from "@/lib/schemas";

export type AdvisoryKind = "runtime_platform" | "dependency" | "application_code";

export type Ecosystem = "php" | "node" | "python" | "java" | "go" | "ruby" | "unknown";

export type Advisory = {
  id: string;
  title: string;
  kind: AdvisoryKind;
  severity: string;
  severitySource: string;
  summary: string;
  component: string;
  ecosystem?: Ecosystem;
  affectedRange: string | null;
  osConstraint?: string;
  sapiConstraint?: string;
  fixedVersions: string[];
  recommendedAction: string;
  remediation: string;
  references: { label: string; url: string }[];
};

export type RepoFile = {
  path: string;
  content: string;
};

export type PatchHunk = {
  path: string;
  reason: string;
  evidenceIds: string[];
  before: string;
  after: string;
};

export type ProposedPatch = {
  summary: string;
  unifiedDiff: string;
  hunks: PatchHunk[];
  prTitle: string;
  prBody: string;
};

export type MubitCallRecord = {
  id: string;
  requestId: string | null;
  taskName: string;
  purpose: "plan" | "repair" | "synthetic_example" | "heldout_eval" | "baseline";
  recordedForTraining: boolean;
  mock: boolean;
  model: string;
  createdAt: string;
  latencyMs: number;
  error: string | null;
};

export type EvalRun = {
  id: string;
  createdAt: string;
  recordedForTraining: false;
  results: {
    caseId: string;
    schemaValid: boolean;
    evidenceIdsValid: boolean;
    requiredActionRecall: number;
    unsupportedClaim: boolean;
    latencyMs: number;
    mubitRequestId: string | null;
    error: string | null;
  }[];
  note: string;
};

export type Scan = {
  id: string;
  name: string;
  createdAt: string;
  repoSource: "fixture" | "upload" | "public_github";
  repoLabel: string;
  advisory: Advisory;
  evidence: RepositoryEvidence[];
  files: RepoFile[];
  inspected: string[];
  notInspected: string[];
  exposure: ExposureAssessment;
  plan: RemediationPlan | null;
  planSource: "mubit" | "mock" | null;
  planRequestId: string | null;
  patch: ProposedPatch | null;
  checks: CheckResult[];
  verification: VerificationRecord | null;
  mubitCalls: MubitCallRecord[];
  policyId?: string;
  policyVersion?: string;
};

type StoreShape = {
  scans: Scan[];
  corrections: CorrectionRecord[];
  evalRuns: EvalRun[];
  mubitCalls: MubitCallRecord[];
};

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

function emptyStore(): StoreShape {
  return { scans: [], corrections: [], evalRuns: [], mubitCalls: [] };
}

function readStore(): StoreShape {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<StoreShape>;
    return {
      scans: parsed.scans ?? [],
      corrections: parsed.corrections ?? [],
      evalRuns: parsed.evalRuns ?? [],
      mubitCalls: parsed.mubitCalls ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreShape) {
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function listScans(): Scan[] {
  return readStore().scans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getScan(id: string): Scan | null {
  return readStore().scans.find((scan) => scan.id === id) ?? null;
}

export function saveScan(scan: Scan): Scan {
  const store = readStore();
  const index = store.scans.findIndex((item) => item.id === scan.id);
  if (index >= 0) store.scans[index] = scan;
  else store.scans.unshift(scan);
  writeStore(store);
  return scan;
}

export function addCorrection(record: CorrectionRecord) {
  const store = readStore();
  store.corrections.unshift(record);
  writeStore(store);
  return record;
}

export function listCorrections(scanId?: string): CorrectionRecord[] {
  const records = readStore().corrections;
  return scanId ? records.filter((item) => item.scanId === scanId) : records;
}

export function addEvalRun(run: EvalRun) {
  const store = readStore();
  store.evalRuns.unshift(run);
  writeStore(store);
  return run;
}

export function listEvalRuns(): EvalRun[] {
  return readStore().evalRuns;
}

export function addMubitCalls(records: MubitCallRecord[]) {
  const store = readStore();
  store.mubitCalls = [...records, ...(store.mubitCalls ?? [])];
  writeStore(store);
}

export function allMubitCalls(): MubitCallRecord[] {
  const store = readStore();
  return [
    ...(store.mubitCalls ?? []),
    ...store.scans.flatMap((scan) => scan.mubitCalls),
  ];
}
