import { readFileSync } from "node:fs";
import path from "node:path";
import type { Advisory } from "@/lib/store";

const ADVISORY_DIR = path.join(process.cwd(), "fixtures", "advisories");

export const SEEDED_ADVISORY_IDS = [
  "php-74-eol",
  "node-16-eol",
  "python-38-eol",
  "php-imagick-cve",
  "php-cgi-windows",
] as const;

export function loadAdvisory(id: string): Advisory {
  const file = path.join(ADVISORY_DIR, `${id}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as Advisory;
}

export function listAdvisories(): Advisory[] {
  return SEEDED_ADVISORY_IDS.map((id) => loadAdvisory(id));
}

export function parseFreeformAdvisory(text: string): Advisory {
  return {
    id: "user-supplied",
    title: "User-supplied advisory",
    kind: /runtime|php\s+\d|node\.?js|python\s+\d/i.test(text)
      ? "runtime_platform"
      : "application_code",
    severity: "unspecified",
    severitySource: "User-supplied text — untrusted until grounded",
    summary: text.slice(0, 2000),
    component: /node/i.test(text) ? "node" : /python/i.test(text) ? "python" : /php/i.test(text) ? "php" : "unknown",
    ecosystem: /node/i.test(text)
      ? "node"
      : /python/i.test(text)
        ? "python"
        : /php/i.test(text)
          ? "php"
          : "unknown",
    affectedRange: null,
    fixedVersions: [],
    recommendedAction: "investigate",
    remediation:
      "Treat this advisory as untrusted input. Establish component, affected range, and evidence before claiming exposure.",
    references: [],
  };
}
