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
      label: "Check Mubit console",
      authoritative: false,
      explanation:
        "Mubit does not expose adapter state on the public inference API, so this app cannot read it live. Last console snapshot (24 Oct 2026, 17:25 London): PatchPilot's advisory-to-migration-plan 3, v1 on Silent test at 10%, 33.3% of 95% on 12 held-out cases, 102 calls, 36 kept, 0.0% answered by the adapter. Silent test is not Passed: every Open Patch reply is still served by gpt-6-luna. Local recorded-call counts are not kept-example counts.",
    },
    consoleSnapshot: {
      observedAt: "2026-10-24T16:25:00Z",
      source: "manual console read, not live telemetry",
      task: CONSOLE_TASK_HINT,
      adapterVersion: "v1",
      adapterState: "Silent test (10%)",
      quality: { matched: 0.333, target: 0.95, testCases: 12, result: "Below target" },
      calls: 102,
      keptExamples: 36,
      answeredByAdapter: 0,
      servedBy: "gpt-6-luna",
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
