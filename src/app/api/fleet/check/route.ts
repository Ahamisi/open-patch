import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { mubitConfigured } from "@/lib/config";
import { callMubitTaskRaw } from "@/lib/llm/mubit";
import { buildPlanUserMessage, parseModelPlan } from "@/lib/llm/plan";
import { getPolicyChoice } from "@/lib/policy";
import { downloadPublicZip } from "@/lib/repo/fetch-zip";
import { parseGithubRepoUrl } from "@/lib/repo/github-url";
import { missingEvidence } from "@/lib/repo/missing";
import { inventoryFromZip } from "@/lib/repo/zip";

export const maxDuration = 60;

const LOG_PATH = path.join(process.cwd(), "data", "fleet-log.jsonl");

/**
 * Fleet check: one advisory against one public repo, plan only.
 * Same Mubit task and the same user message a full check sends, but nothing about the
 * repository is saved locally — only one line per call in data/fleet-log.jsonl.
 */
export async function POST(request: Request) {
  if (!mubitConfigured()) {
    return Response.json({ error: "MUBIT_API_KEY is not configured." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    githubUrl?: string;
    advisoryId?: string;
    policyId?: string;
  };
  const ref = parseGithubRepoUrl(body.githubUrl ?? "");
  if (!ref) return Response.json({ error: "Paste a public GitHub repository link." }, { status: 400 });

  const started = Date.now();
  try {
    const advisory = loadAdvisory(body.advisoryId ?? "php-74-eol");
    const policy = getPolicyChoice(body.policyId);
    const inventory = inventoryFromZip(await downloadPublicZip(ref.zipUrl), `github:${ref.label}`);
    const evidence = [...inventory.evidence, ...missingEvidence(new Date().toISOString())];
    const exposure = assessExposure(advisory, inventory.files, evidence);
    const sessionId = `fleet-${crypto.randomUUID()}`;
    const userContent = buildPlanUserMessage({
      id: sessionId,
      advisory,
      evidence,
      exposure,
      policyVersion: policy.version,
    });
    const result = await callMubitTaskRaw({
      purpose: "plan",
      userContent,
      recordForTraining: true,
      sessionId,
    });
    const plan = parseModelPlan(result.content || "");
    const row = {
      at: new Date().toISOString(),
      repo: ref.label,
      advisory: advisory.id,
      exposure: exposure.status,
      detectedVersion: exposure.detectedVersion,
      requestId: result.record.requestId,
      requestBytes: userContent.length,
      parsed: Boolean(plan),
      actions: plan?.actions.length ?? null,
      latencyMs: Date.now() - started,
    };
    mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, `${JSON.stringify(row)}\n`);
    return Response.json({ ...row, summary: plan?.summary ?? null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Fleet check failed", repo: ref.label },
      { status: 400 },
    );
  }
}
