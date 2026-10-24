import type { RepositoryEvidence } from "@/lib/schemas";

export function missingEvidence(collectedAt: string): RepositoryEvidence[] {
  return [
    {
      id: "ev-missing-os",
      path: "(production host)",
      kind: "runtime_config",
      excerpt: "Production operating system and SAPI were not present in the repository.",
      sha256: "missing",
      sourceLabel: "scanner",
      confidence: "missing",
      collectedAt,
    },
    {
      id: "ev-missing-live-runtime",
      path: "(live process)",
      kind: "runtime_config",
      excerpt: "No live PHP process was inspected. Pins are repository evidence only.",
      sha256: "missing",
      sourceLabel: "scanner",
      confidence: "missing",
      collectedAt,
    },
  ];
}
