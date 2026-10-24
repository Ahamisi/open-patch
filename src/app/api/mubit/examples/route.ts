import { sendShapedExamples, sendSyntheticExamples, shapedExampleCount, syntheticExampleCount } from "@/lib/llm/synthetic";
import { mubitConfigured } from "@/lib/config";
import { addMubitCalls } from "@/lib/store";

export async function GET() {
  return Response.json({
    available: syntheticExampleCount(),
    shaped: shapedExampleCount(),
    configured: mubitConfigured(),
    taskName: "advisory_to_migration_plan",
    grouping:
      "Mubit groups calls that share model, system instructions, tools, tool choice, and output format. Variable content stays in the user message.",
  });
}

export async function POST(request: Request) {
  if (!mubitConfigured()) {
    return Response.json(
      {
        error: "MUBIT_API_KEY is not configured. Refusing to label mock output as a Mubit result.",
      },
      { status: 400 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    limit?: number;
    offset?: number;
    shaped?: boolean;
  };
  const records = body.shaped
    ? await sendShapedExamples(body.limit ?? 8, body.offset ?? 0)
    : await sendSyntheticExamples(body.limit ?? 8, body.offset ?? 0);
  addMubitCalls(records);
  return Response.json({
    sent: records.length,
    records,
    note: "These calls use the same system prompt as live plan generation. Check Requests in the Mubit console. Training typically needs 25 kept examples; the console count is authoritative.",
  });
}
