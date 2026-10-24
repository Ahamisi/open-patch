import { TASK_NAME, mubitConfigured } from "@/lib/config";
import { CONSOLE_TASK_HINT, MUBIT_CONSOLE_URL } from "@/lib/llm/mubit";
import { allMubitCalls, listCorrections, listEvalRuns, listScans } from "@/lib/store";

export async function GET() {
  const calls = allMubitCalls();
  const recorded = calls.filter((call) => call.recordedForTraining && !call.mock);
  return Response.json({
    configured: mubitConfigured(),
    taskName: TASK_NAME,
    consoleTaskHint: CONSOLE_TASK_HINT,
    consoleUrl: MUBIT_CONSOLE_URL,
    adapterStatus: {
      label: "Collecting examples",
      authoritative: false,
      explanation:
        "Mubit does not expose adapter state on the public inference API. Open Tasks in the console. The live grouping is PatchPilot's advisory-to-migration-plan 3. Plan 2 is an older split. Local recorded-call counts are not kept-example counts. This app never claims an adapter passed.",
    },
    localCounts: {
      recordedCalls: recorded.length,
      mockCalls: calls.filter((call) => call.mock).length,
      heldOutCalls: calls.filter((call) => call.purpose === "heldout_eval").length,
      corrections: listCorrections().length,
      scans: listScans().length,
      evalRuns: listEvalRuns().length,
      frontierPlans: calls.filter((call) => call.purpose === "plan" && !call.mock).length,
      notesExamples: calls.filter((call) => call.purpose === "synthetic_example" && !call.mock).length,
    },
    recentRequestIds: recorded
      .map((call) => call.requestId)
      .filter((id): id is string => Boolean(id))
      .slice(0, 12),
    calls: calls.slice(0, 40),
    docs: {
      consoleHint: `Open ${MUBIT_CONSOLE_URL} → Tasks → ${CONSOLE_TASK_HINT}`,
      firstAdapter: "https://docs.mubit.ai/guides/first-adapter",
      connect: "https://docs.mubit.ai/guides/connect-openai",
    },
  });
}
