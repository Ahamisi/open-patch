import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { listAdvisories, loadAdvisory, parseFreeformAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { getRepoChoice, REPO_CATALOG } from "@/lib/repo/catalog";
import { labelUploadedRepo } from "@/lib/repo/intake";
import { downloadPublicZip } from "@/lib/repo/fetch-zip";
import { collectFromDisk } from "@/lib/repo/inventory";
import { missingEvidence } from "@/lib/repo/missing";
import { inventoryFromZip } from "@/lib/repo/zip";
import { getPolicyChoice, POLICY_CATALOG } from "@/lib/policy";
import { completeConversion } from "@/lib/demo/convert";
import { publicScan } from "@/lib/public-scan";
import { getScan, listScans, saveScan, type Scan } from "@/lib/store";

export const maxDuration = 60;

const FIXTURE_ROOT = path.join(process.cwd(), "fixtures", "repos", "legacy-billing-php");

export async function GET() {
  return Response.json({
    scans: listScans().map(publicScan),
    advisories: listAdvisories(),
    repos: REPO_CATALOG,
    policies: POLICY_CATALOG,
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let name = "PHP scan";
  let repoId = "legacy-billing-php";
  let advisoryId = "php-74-eol";
  let advisoryText = "";
  let policyId = "sec-runtime-01";
  let zip: Buffer | null = null;
  let zipFileName: string | undefined;
  let convert = false;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    name = String(form.get("name") ?? name);
    repoId = String(form.get("repoId") ?? repoId);
    advisoryId = String(form.get("advisoryId") ?? advisoryId);
    advisoryText = String(form.get("advisoryText") ?? "");
    policyId = String(form.get("policyId") ?? policyId);
    convert = String(form.get("convert") ?? "") === "1";
    const file = form.get("zip");
    if (file instanceof File && file.size > 0) {
      zip = Buffer.from(await file.arrayBuffer());
      zipFileName = file.name;
    }
  } else {
    const body = (await request.json()) as {
      name?: string;
      repoId?: string;
      advisoryId?: string;
      advisoryText?: string;
      policyId?: string;
      convert?: boolean;
    };
    name = body.name ?? name;
    repoId = body.repoId ?? repoId;
    advisoryId = body.advisoryId ?? advisoryId;
    advisoryText = body.advisoryText ?? "";
    policyId = body.policyId ?? policyId;
    convert = Boolean(body.convert);
  }

  const advisory =
    advisoryId === "custom" || advisoryText.trim()
      ? parseFreeformAdvisory(advisoryText || "No advisory text supplied.")
      : loadAdvisory(advisoryId);

  const choice = repoId === "upload" ? undefined : getRepoChoice(repoId);
  let inventory;
  let repoSource: Scan["repoSource"] = "fixture";
  let repoLabel = "Harbor Ledger (synthetic fixture)";

  try {
    if (zip) {
      inventory = inventoryFromZip(zip, "uploaded-zip");
      repoSource = "upload";
      repoLabel = labelUploadedRepo(name, zipFileName);
    } else if (choice?.origin === "public_github") {
      const cached = choice.localZip
        ? path.join(process.cwd(), "fixtures", "archives", choice.localZip)
        : null;
      const archive =
        cached && existsSync(cached)
          ? readFileSync(cached)
          : choice.zipUrl
            ? await downloadPublicZip(choice.zipUrl)
            : null;
      if (!archive) throw new Error("No local archive or GitHub ZIP URL for this repository.");
      inventory = inventoryFromZip(
        archive,
        cached && existsSync(cached) ? `cached-zip:${choice.id}` : `github:${choice.id}`,
      );
      repoSource = "public_github";
      repoLabel = choice.name;
    } else {
      inventory = collectFromDisk(FIXTURE_ROOT, "fixture:legacy-billing-php");
      repoSource = "fixture";
      repoLabel = "Harbor Ledger (synthetic fixture)";
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Repository intake failed" },
      { status: 400 },
    );
  }

  const evidence = [...inventory.evidence, ...missingEvidence(new Date().toISOString())];
  const exposure = assessExposure(advisory, inventory.files, evidence);
  if (repoSource === "upload" && /harbor ledger|^php scan$/i.test(name)) {
    name = `${repoLabel} scan`;
  }
  const scan: Scan = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    repoSource,
    repoLabel,
    advisory,
    evidence,
    files: inventory.files,
    inspected: inventory.inspected,
    notInspected: inventory.notInspected,
    exposure,
    plan: null,
    planSource: null,
    planRequestId: null,
    patch: null,
    checks: [],
    verification: null,
    mubitCalls: [],
    policyId: getPolicyChoice(policyId).id,
    policyVersion: getPolicyChoice(policyId).version,
  };

  saveScan(scan);
  if (convert) {
    await completeConversion(scan);
  }
  return Response.json({ scan: publicScan(getScan(scan.id)!), converted: convert });
}
