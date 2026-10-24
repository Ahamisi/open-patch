import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MubitCallOptions } from "@/lib/llm/mubit";

const calls: MubitCallOptions[] = [];
const replies = [
  "not json at all",
  JSON.stringify({
    summary: "Upgrade the runtime pins.",
    actions: [
      {
        id: "act-1",
        type: "runtime_upgrade",
        priority: "high",
        description: "Move Dockerfile off 7.4",
        files: ["Dockerfile"],
        evidenceIds: ["ev-1"],
        risk: "compat",
        rollback: "revert",
      },
    ],
    verificationSteps: ["re-parse pins"],
    missingInformation: [],
    humanApprovalRequired: true,
  }),
];

vi.mock("@/lib/llm/mubit", () => ({
  callMubitTaskRaw: vi.fn(async (options: MubitCallOptions) => {
    calls.push(options);
    return {
      content: replies[calls.length - 1] ?? "",
      rawHeaders: {},
      record: {
        id: `mubit_${calls.length}`,
        requestId: `mreq_${calls.length}`,
        taskName: "advisory_to_migration_plan",
        purpose: options.purpose,
        recordedForTraining: options.recordForTraining,
        mock: false,
        model: "gpt-6-luna",
        createdAt: new Date().toISOString(),
        latencyMs: 1,
        error: null,
      },
    };
  }),
}));

vi.mock("@/lib/store", () => ({ listCorrections: () => [] }));

describe("plan repair", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("keeps the repair retry out of training and in the same session", async () => {
    const { generateRemediationPlan } = await import("@/lib/llm/plan");
    const result = await generateRemediationPlan({
      id: "scan_repair",
      advisory: { id: "php-74-eol", title: "PHP 7.4 is end-of-life", component: "php" },
      exposure: { status: "affected", evidenceIds: ["ev-1"], limitations: [] },
      evidence: [{ id: "ev-1", path: "Dockerfile", kind: "runtime_config", excerpt: "FROM php:7.4-apache" }],
      files: [],
    } as never);

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ purpose: "plan", recordForTraining: true, sessionId: "scan_repair" });
    expect(calls[1]).toMatchObject({ purpose: "repair", recordForTraining: false, sessionId: "scan_repair" });
    expect(result.source).toBe("mubit");
    expect(result.requestId).toBe("mreq_2");
  });
});
