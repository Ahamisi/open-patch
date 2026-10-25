import { planEvidence } from "@/lib/llm/plan";

/**
 * Second Mubit task: the pin decision on its own.
 *
 * Plan 3 asks a small model to reproduce long free-text plans, which a 4B adapter matches
 * about a third of the time. This task asks for a short, near-deterministic answer (exposure,
 * detected version, the exact pin lines to change, one short reason) so the provider's answers
 * are consistent enough for an adapter to learn and pass.
 *
 * FROZEN once traffic starts: one word changed here starts yet another task.
 */
export const PIN_SYSTEM_PROMPT = [
  "You are Open Patch's pin-decision task.",
  "Read the JSON in the user message: advisory, exposure, houseRule and pin evidence.",
  'Return only JSON: {"exposure":"affected|not_affected|unknown","detectedVersion":string|null,"changes":[{"file":string,"from":string,"to":string}],"reason":string}.',
  "Rules:",
  "- Copy exposure.status and exposure.detectedVersion from the user message exactly.",
  "- List a change only for an evidence file whose excerpt pins an affected version. from and to are the exact pin text before and after, taken from houseRule.",
  "- changes is empty when exposure is not_affected or unknown.",
  "- Never list application source files.",
  "- reason is one sentence of at most 20 words.",
].join(" ");

const HOUSE_RULE: Record<string, string> = {
  php: 'PHP: Docker image keeps its variant on 8.2 (php:7.4-apache -> php:8.2-apache, php:7.4-fpm-alpine -> php:8.2-fpm-alpine); composer require "php": ">=8.2 <8.4"; composer platform "php": "8.2.35"; .php-version 8.2.35; CI php-version 8.2.',
  node: "Node: Docker image keeps its variant on 20 (node:16-alpine -> node:20-alpine); engines.node >=20; .nvmrc 20.",
  python: "Python: Docker image keeps its variant on 3.12 (python:3.8-slim -> python:3.12-slim); runtime.txt python-3.12; .python-version 3.12; requires-python >=3.12.",
};

const PIN_LINE = /(FROM\s|php|node|python|version|engines|requires-python|platform)/i;

function trimExcerpt(excerpt: string | undefined): string {
  if (!excerpt) return "";
  const lines = excerpt.split("\n").filter((line) => PIN_LINE.test(line)).slice(0, 6);
  return (lines.length ? lines : excerpt.split("\n").slice(0, 3)).join("\n").slice(0, 400);
}

export function buildPinUserMessage(input: {
  advisory: { id: string; title: string; component?: string; affectedRange?: string | null };
  exposure: { status: string; detectedVersion: string | null; evidenceIds?: string[] };
  evidence: Array<{ id: string; path: string; kind: string; confidence?: string; excerpt?: string }>;
}): string {
  const ecosystem = (input.advisory.component ?? "php").toLowerCase().includes("node")
    ? "node"
    : (input.advisory.component ?? "").toLowerCase().includes("python")
      ? "python"
      : "php";
  const evidence = planEvidence(input)
    .filter((item) => item.confidence !== "missing" && item.kind !== "advisory")
    .slice(0, 8)
    .map((item) => ({ id: item.id, path: item.path, excerpt: trimExcerpt(item.excerpt) }));
  return JSON.stringify({
    advisory: { id: input.advisory.id, component: input.advisory.component ?? null, affectedRange: input.advisory.affectedRange ?? null },
    exposure: { status: input.exposure.status, detectedVersion: input.exposure.detectedVersion },
    houseRule: HOUSE_RULE[ecosystem],
    evidence,
  });
}
