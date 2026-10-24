import { publicScan } from "@/lib/public-scan";
import { generateProposedPatch } from "@/lib/patches/generate";
import { getScan, saveScan } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  if (!scan.plan) {
    return Response.json({ error: "Create a remediation plan first." }, { status: 400 });
  }

  scan.patch = generateProposedPatch(scan);
  saveScan(scan);
  return Response.json({ scan: publicScan(scan) });
}
