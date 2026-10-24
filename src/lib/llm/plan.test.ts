import { describe, expect, it } from "vitest";
import { PLAN_SYSTEM_PROMPT } from "@/lib/llm/mubit";
import { buildPlanUserMessage, parseModelPlan, teamNotesFromCorrections } from "@/lib/llm/plan";
import type { CorrectionRecord } from "@/lib/schemas";

const scan = {
  id: "scan_demo",
  advisory: {
    id: "php-74-eol",
    title: "PHP 7.4 is end-of-life",
    kind: "runtime_platform" as const,
    component: "php",
  },
  exposure: {
    status: "affected" as const,
    evidenceIds: ["ev-1"],
    limitations: [],
  },
  evidence: [
    {
      id: "ev-1",
      path: "Dockerfile",
      kind: "runtime_config" as const,
      confidence: "high" as const,
      excerpt: "FROM php:7.4-apache",
    },
  ],
};

describe("frozen Mubit task", () => {
  it("keeps the exact system prompt that already has console traffic", () => {
    expect(PLAN_SYSTEM_PROMPT.startsWith("You are PatchPilot's advisory-to-migration-plan task.")).toBe(
      true,
    );
    expect(PLAN_SYSTEM_PROMPT).toContain("humanApprovalRequired must be true.");
    expect(PLAN_SYSTEM_PROMPT).not.toContain("TEAM_NOTES");
  });
});

describe("team notes stay in the user message", () => {
  it("lists reviewer notes without changing the system prompt", () => {
    const message = buildPlanUserMessage(scan, [
      "A source edit cannot remediate the interpreter. Return runtime_upgrade.",
    ]);
    const parsed = JSON.parse(message) as { teamNotes: string[]; sessionId: string };
    expect(parsed.sessionId).toBe("scan_demo");
    expect(parsed.teamNotes[0]).toMatch(/runtime_upgrade/);
    expect(message).toContain("teamNotes");
  });

  it("puts a policy refresh in the user message, not the system prompt", () => {
    const message = buildPlanUserMessage(
      { ...scan, policyVersion: "SEC-RUNTIME-01-REFRESH@2026-10-24" },
      [],
    );
    expect(message).toContain("SEC-RUNTIME-01-REFRESH@2026-10-24");
    expect(PLAN_SYSTEM_PROMPT).not.toContain("REFRESH");
  });

  it("dedupes notes and ignores a correct label", () => {
    const corrections = [
      {
        reviewerLabel: "correct",
        correctedOutput: "looks good",
      },
      {
        reviewerLabel: "incorrect",
        correctedOutput: "Use runtime_upgrade, not code_change.",
      },
      {
        reviewerLabel: "incorrect",
        correctedOutput: "Use runtime_upgrade, not code_change.",
      },
    ] as CorrectionRecord[];
    expect(teamNotesFromCorrections(corrections, "  Use runtime_upgrade, not code_change.  ")).toEqual([
      "Use runtime_upgrade, not code_change.",
    ]);
  });
});

describe("parseModelPlan", () => {
  it("accepts fenced JSON and missing action ids", () => {
    const plan = parseModelPlan(`\`\`\`json
{
  "summary": "Upgrade the runtime pins.",
  "actions": [{
    "type": "Runtime upgrade",
    "priority": "HIGH",
    "description": "Move Dockerfile off 7.4",
    "files": "Dockerfile",
    "evidence_ids": ["ev-1"],
    "risk": "compat",
    "rollback": "revert"
  }],
  "verificationSteps": ["re-parse pins"]
}
\`\`\``);
    expect(plan?.actions[0].id).toBe("act-1");
    expect(plan?.actions[0].type).toBe("runtime_upgrade");
    expect(plan?.actions[0].priority).toBe("high");
    expect(plan?.actions[0].files).toEqual(["Dockerfile"]);
    expect(plan?.humanApprovalRequired).toBe(true);
  });
});
