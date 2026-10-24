import { callMubitTaskRaw } from "@/lib/llm/mubit";
import type { Scan } from "@/lib/store";

/**
 * Plain engineer task. Different system prompt on purpose so Mubit does not
 * mix this with plan 3. Never stored for training.
 */
export const BASELINE_SYSTEM_PROMPT = [
  "You are a senior software engineer using a frontier coding model.",
  "The user will give a vulnerability advisory and repository files.",
  "Propose a concrete fix. Be decisive.",
  "Return only JSON:",
  '{"summary":string,"claim":string,"actions":[{"type":string,"files":string[],"description":string}]}',
  "claim must be one sentence stating what the change remediates.",
].join(" ");

export type BaselineAction = {
  type: string;
  files: string[];
  description: string;
};

export type BaselinePlan = {
  summary: string;
  claim: string;
  actions: BaselineAction[];
};

const PIN = /dockerfile|composer\.json|php-version|nvmrc|node-version|runtime\.txt|pyproject|ci\.yml|workflow/i;

export function touchesRuntimePin(files: string[]): boolean {
  return files.some((file) => PIN.test(file));
}

export function parseBaselinePlan(raw: string): BaselinePlan | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(trimmed) as {
      summary?: unknown;
      claim?: unknown;
      actions?: unknown;
    };
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.map((item) => {
          const row = item as { type?: unknown; files?: unknown; description?: unknown };
          return {
            type: String(row.type ?? "code_change"),
            files: Array.isArray(row.files) ? row.files.map(String) : [],
            description: String(row.description ?? ""),
          };
        })
      : [];
    return {
      summary: String(parsed.summary ?? "").trim() || "No summary.",
      claim: String(parsed.claim ?? "").trim(),
      actions,
    };
  } catch {
    return null;
  }
}

export function buildBaselineUserMessage(scan: Pick<Scan, "advisory" | "evidence">): string {
  const files = scan.evidence
    .filter((item) => ["src/Invoice.php", "src/Payment.php", "public/index.php"].includes(item.path))
    .map((item) => ({ path: item.path, excerpt: item.excerpt }));
  return JSON.stringify(
    {
      ask: "My PHP app has this vulnerability. Fix it. Here is the application source.",
      advisory: {
        title: scan.advisory.title,
        summary: scan.advisory.summary,
        affectedRange: scan.advisory.affectedRange,
        component: scan.advisory.component,
      },
      files,
    },
    null,
    2,
  );
}

export function claimFromBaseline(plan: BaselinePlan, detectedVersion: string | null): string {
  if (plan.claim) return plan.claim;
  const files = plan.actions.flatMap((action) => action.files);
  if (!touchesRuntimePin(files)) {
    return `Editing ${files.join(", ") || "application source"} remediates the unsupported PHP ${detectedVersion ?? "7.4"} runtime without changing Dockerfile, composer.json, .php-version, or CI.`;
  }
  return plan.summary;
}

export function evidenceFromBaseline(input: {
  detectedVersion: string | null;
  plan: BaselinePlan;
}): string {
  const files = input.plan.actions.flatMap((action) => action.files);
  const pin = touchesRuntimePin(files);
  return [
    `Advisory: PHP 7.4 is end-of-life. Interpreter fixes ship on supported PHP only.`,
    `Deterministic exposure: affected. Detected runtime pin: ${input.detectedVersion ?? "7.4"}.`,
    `Frontier engineer proposal: ${input.plan.summary}`,
    `Files named: ${files.join(", ") || "none"}.`,
    pin
      ? `The proposal names at least one runtime pin.`
      : `The proposal does not name Dockerfile, composer.json, .php-version, or CI. Those pins stay on 7.4.`,
    `Policy SEC-RUNTIME-01: a source-code change cannot, by itself, remediate a vulnerable or unsupported runtime.`,
  ].join("\n\n");
}

export async function runBaselineMigration(scan: Pick<Scan, "id" | "advisory" | "evidence">): Promise<{
  plan: BaselinePlan;
  requestId: string | null;
  latencyMs: number;
  raw: string;
  error: string | null;
}> {
  const result = await callMubitTaskRaw({
    purpose: "baseline",
    taskName: "plain_frontier_migration",
    systemPrompt: BASELINE_SYSTEM_PROMPT,
    userContent: buildBaselineUserMessage(scan),
    recordForTraining: false,
    sessionId: `baseline-${scan.id}`,
  });
  const parsed = parseBaselinePlan(result.content);
  return {
    plan:
      parsed ?? {
        summary: result.content.trim() || "Baseline model returned no parseable plan.",
        claim: "",
        actions: [],
      },
    requestId: result.record.requestId,
    latencyMs: result.record.latencyMs,
    raw: result.content,
    error: result.record.error,
  };
}
