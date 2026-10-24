import { mubitConfigured } from "@/lib/config";
import { runHeldOutEvaluation } from "@/lib/evaluation/heldout";
import { addEvalRun, listEvalRuns } from "@/lib/store";

export async function GET() {
  return Response.json({ runs: listEvalRuns() });
}

export async function POST() {
  if (!mubitConfigured()) {
    return Response.json(
      { error: "Held-out evaluation needs a real Mubit key. Mock numbers are not reported." },
      { status: 400 },
    );
  }
  const run = await runHeldOutEvaluation();
  addEvalRun(run);
  return Response.json({ run });
}
