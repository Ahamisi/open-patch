import { publicScan } from "@/lib/public-scan";
import { generateRemediationPlan } from "@/lib/llm/plan";
import { getScan, saveScan } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });

  const result = await generateRemediationPlan(scan);
  scan.plan = result.plan;
  scan.planSource = result.source;
  scan.planRequestId = result.requestId;
  scan.mubitCalls.push(...result.calls);
  saveScan(scan);

  return Response.json({
    scan: publicScan(scan),
    source: result.source,
    labelledMock: result.source === "mock",
  });
}
