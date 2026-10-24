import { readFileSync } from "node:fs";
import path from "node:path";
import { POLICY_VERSION } from "@/lib/config";

export type PolicyChoice = {
  id: string;
  version: string;
  title: string;
  file: string;
  note: string;
};

export const POLICY_CATALOG: PolicyChoice[] = [
  {
    id: "sec-runtime-01",
    version: POLICY_VERSION,
    title: "SEC-RUNTIME-01 — supported line 8.2",
    file: "sec-runtime-01.md",
    note: "Last week's rule. An 8.2 pin is the accepted fix.",
  },
  {
    id: "sec-runtime-01-refresh",
    version: "SEC-RUNTIME-01-REFRESH@2026-10-24",
    title: "SEC-RUNTIME-01 refresh — supported line 8.3",
    file: "sec-runtime-01-refresh.md",
    note: "Fast refresh. Last week's 8.2 pin is now the bug. Same Mubit task — only this user-message field changes.",
  },
];

export function getPolicyChoice(id?: string | null): PolicyChoice {
  return POLICY_CATALOG.find((item) => item.id === id) ?? POLICY_CATALOG[0];
}

export function loadPolicy(id?: string | null): { id: string; version: string; text: string } {
  const choice = getPolicyChoice(id);
  return {
    id: choice.id,
    version: choice.version,
    text: readFileSync(path.join(process.cwd(), "fixtures", "policies", choice.file), "utf8"),
  };
}

export function buildSaplingClaim(scanSummary: {
  exposureStatus: string;
  detectedVersion: string | null;
  patchedVersion: string | null;
  checksPassed: boolean;
  checksRun: boolean;
}): string {
  if (!scanSummary.checksRun) {
    return "The proposed remediation satisfies policy SEC-RUNTIME-01.";
  }
  return `The proposed remediation satisfies policy SEC-RUNTIME-01 because the repository runtime pin moves from ${scanSummary.detectedVersion ?? "unknown"} to ${scanSummary.patchedVersion ?? "unspecified"} and the allowlisted version checks that apply ${scanSummary.checksPassed ? "passed" : "did not all pass"}.`;
}

export function buildSaplingEvidence(parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}
