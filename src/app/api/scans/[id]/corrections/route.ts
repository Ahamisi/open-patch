import { publicScan } from "@/lib/public-scan";
import { POLICY_VERSION, TASK_NAME } from "@/lib/config";
import { buildPlanUserMessage, teamNotesFromCorrections } from "@/lib/llm/plan";
import { callMubitTaskRaw } from "@/lib/llm/mubit";
import { reviewerLabelSchema } from "@/lib/schemas";
import { addCorrection, getScan, listCorrections, saveScan } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });

  const body = (await request.json()) as {
    reviewerLabel?: string;
    note?: string;
    target?: "plan" | "verification";
  };
  const parsedLabel = reviewerLabelSchema.safeParse(body.reviewerLabel);
  if (!parsedLabel.success) {
    return Response.json({ error: "reviewerLabel must be correct, incorrect, or needs_more_evidence" }, { status: 400 });
  }

  const originalOutput =
    body.target === "verification" ? scan.verification : scan.plan;

  let followupRequestId: string | null = null;
  if (parsedLabel.data === "incorrect" && scan.plan) {
    try {
      const teamNotes = teamNotesFromCorrections(listCorrections(), body.note);
      const follow = await callMubitTaskRaw({
        purpose: "synthetic_example",
        recordForTraining: true,
        sessionId: scan.id,
        userContent: buildPlanUserMessage(scan, teamNotes),
      });
      followupRequestId = follow.record.requestId;
      scan.mubitCalls.push(follow.record);
      saveScan(scan);
    } catch {
      followupRequestId = null;
    }
  }

  const correction = addCorrection({
    id: crypto.randomUUID(),
    runId: scan.planRequestId ?? scan.id,
    scanId: scan.id,
    taskName: TASK_NAME,
    originalOutput,
    reviewerLabel: parsedLabel.data,
    correctedOutput: body.note ?? "",
    evidenceIds: scan.exposure.evidenceIds,
    policyVersion: scan.policyVersion ?? POLICY_VERSION,
    mubitRequestId: followupRequestId,
    createdAt: new Date().toISOString(),
  });

  if (scan.verification) {
    scan.verification.humanReviewStatus = parsedLabel.data;
    saveScan(scan);
  }

  return Response.json({
    scan: publicScan(getScan(scan.id)!),
    correction,
    note: "The correction is persisted. It does not instantly change a Mubit adapter. Additional recorded examples are sent only when the label is incorrect.",
  });
}
