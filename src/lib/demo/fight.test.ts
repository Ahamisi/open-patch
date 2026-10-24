import { describe, expect, it } from "vitest";
import { PLAN_SYSTEM_PROMPT } from "@/lib/llm/mubit";
import {
  BASELINE_SYSTEM_PROMPT,
  buildBaselineUserMessage,
  claimFromBaseline,
  parseBaselinePlan,
  touchesRuntimePin,
} from "@/lib/demo/baseline";
import { saplingCard } from "@/lib/demo/fight";

describe("fight baseline", () => {
  it("uses a different system prompt than the frozen Open Patch task", () => {
    expect(BASELINE_SYSTEM_PROMPT.includes("PatchPilot")).toBe(false);
    expect(BASELINE_SYSTEM_PROMPT.includes("source-code patch cannot remediate")).toBe(false);
    expect(PLAN_SYSTEM_PROMPT.startsWith("You are PatchPilot's advisory-to-migration-plan task.")).toBe(
      true,
    );
  });

  it("gives the plain route application source, not the runtime pins", () => {
    const message = buildBaselineUserMessage({
      advisory: {
        title: "PHP 7.4 is end-of-life",
        summary: "Unsupported runtime.",
        affectedRange: ">=7.4 <8.0",
        component: "php",
      } as never,
      evidence: [
        { path: "Dockerfile", excerpt: "FROM php:7.4-apache" },
        { path: "src/Invoice.php", excerpt: "class Invoice {}" },
      ] as never,
    });
    expect(message).toContain("Invoice.php");
    expect(message).not.toContain("Dockerfile");
  });

  it("parses a frontier JSON plan", () => {
    const plan = parseBaselinePlan(
      '{"summary":"Rewrite Invoice.php","claim":"Source edit fixes PHP 7.4","actions":[{"type":"code_change","files":["src/Invoice.php"],"description":"Sanitize"}]}',
    );
    expect(plan?.actions[0]?.files).toEqual(["src/Invoice.php"]);
    expect(touchesRuntimePin(plan?.actions[0]?.files ?? [])).toBe(false);
    expect(claimFromBaseline(plan!, "7.4")).toMatch(/Source edit/);
  });

  it("keeps raw Sapling scores even when status is unsure", () => {
    const card = saplingCard("test", {
      ok: true,
      raw: {},
      error: null,
      parsed: {
        status: "unsure",
        raw_label: "violation",
        probabilities: { violation: 0.99, supported: 0.01 },
        prediction_set: ["violation", "insufficient_information"],
        timing_ms: { model: 100 },
      },
    });
    expect(card.rawLabel).toBe("violation");
  });
});
