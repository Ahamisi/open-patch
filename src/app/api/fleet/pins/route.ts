import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { mubitConfigured } from "@/lib/config";
import { callMubitTaskRaw } from "@/lib/llm/mubit";
import { buildPinUserMessage, PIN_SYSTEM_PROMPT } from "@/lib/llm/pin-task";
import { downloadPublicZip } from "@/lib/repo/fetch-zip";
import { parseGithubRepoUrl } from "@/lib/repo/github-url";
import { missingEvidence } from "@/lib/repo/missing";
import { inventoryFromZip } from "@/lib/repo/zip";

export const maxDuration = 60;

const LOG_PATH = path.join(process.cwd(), "data", "pin-log.jsonl");

/** One public repo through the pin-decision Mubit task. Nothing about the repo is saved locally. */
export async function POST(request: Request) {
  if (!mubitConfigured()) {
    return Response.json({ error: "MUBIT_API_KEY is not configured." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { githubUrl?: string; advisoryId?: string };
  const ref = parseGithubRepoUrl(body.githubUrl ?? "");
  if (!ref) return Response.json({ error: "Paste a public GitHub repository link." }, { status: 400 });

  const started = Date.now();
  try {
    const advisory = loadAdvisory(body.advisoryId ?? "php-74-eol");
    const inventory = inventoryFromZip(await downloadPublicZip(ref.zipUrl), `github:${ref.label}`);
    const evidence = [...inventory.evidence, ...missingEvidence(new Date().toISOString())];
    const exposure = assessExposure(advisory, inventory.files, evidence);
    const sessionId = `pins-${crypto.randomUUID()}`;
    const userContent = buildPinUserMessage({ advisory, exposure, evidence });
    const result = await callMubitTaskRaw({
      purpose: "plan",
      userContent,
      recordForTraining: true,
      sessionId,
      systemPrompt: PIN_SYSTEM_PROMPT,
      taskName: "pin_decision",
    });
    let parsed: { changes?: unknown[] } | null = null;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      parsed = null;
    }
    const row = {
      at: new Date().toISOString(),
      repo: ref.label,
      advisory: advisory.id,
      exposure: exposure.status,
      requestId: result.record.requestId,
      requestBytes: userContent.length,
      replyBytes: result.content.length,
      parsed: Boolean(parsed),
      changes: Array.isArray(parsed?.changes) ? parsed.changes.length : null,
      latencyMs: Date.now() - started,
    };
    mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, `${JSON.stringify(row)}\n`);
    return Response.json({ ...row, reply: parsed });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Pin check failed", repo: ref.label },
      { status: 400 },
    );
  }
}
