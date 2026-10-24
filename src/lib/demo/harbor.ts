import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { completeConversion } from "@/lib/demo/convert";
import { collectFromDisk } from "@/lib/repo/inventory";
import { missingEvidence } from "@/lib/repo/missing";
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

export async function runHarborLedgerDemo(): Promise<{ scan: Scan }> {
  const started = createHarborScan();
  saveScan(started);
  const scan = await completeConversion(started);
  return { scan };
}
