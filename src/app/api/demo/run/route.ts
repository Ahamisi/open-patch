import { runHarborLedgerDemo } from "@/lib/demo/harbor";
import { publicScan } from "@/lib/public-scan";

export async function POST() {
  const started = Date.now();
  const { scan } = await runHarborLedgerDemo();
  return Response.json({
    scan: publicScan(scan),
    elapsedMs: Date.now() - started,
    mubit: {
      source: scan.planSource,
      requestId: scan.planRequestId,
    },
    sapling: {
      verdict: scan.verification?.saplingVerdict ?? null,
      status: scan.verification?.verificationStatus ?? null,
    },
  });
}
