import { publicScan } from "@/lib/public-scan";
import { runAllowlistedChecks } from "@/lib/checks/run";
import { getScan, saveScan } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  if (!scan.patch) {
    return Response.json({ error: "Generate a patch before running checks." }, { status: 400 });
  }

  scan.checks = runAllowlistedChecks(scan);
  saveScan(scan);
  return Response.json({
    scan: publicScan(scan),
    note: "Allowlisted static checks only. Composer scripts, container builds, and repository CI were not executed.",
  });
}
