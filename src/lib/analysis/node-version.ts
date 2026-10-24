import { constraintOverlap } from "@/lib/analysis/php-version";

export function extractNodeEngines(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { engines?: { node?: string } };
    return parsed.engines?.node ?? null;
  } catch {
    return null;
  }
}

export function extractNodeVersionFile(content: string): string | null {
  const line = content.trim().split(/\r?\n/)[0] ?? "";
  if (!line || /^lts\//i.test(line)) return null;
  const match = line.match(/(\d+(?:\.\d+){0,2})/);
  return match?.[1] ?? null;
}

export function extractCiNodeVersion(content: string): string | null {
  const match = content.match(/node-version:\s*['"]?(\d+(?:\.\d+){0,2}|lts\/[a-z]+)['"]?/i);
  if (!match?.[1] || /^lts\//i.test(match[1])) return match?.[1]?.match(/^(\d+)/)?.[1] ?? null;
  return match[1];
}

export function rewriteNodeEngines(
  content: string,
  options: { addIfMissing: boolean; target?: string },
): string | null {
  let parsed: { engines?: { node?: string } };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    return null;
  }
  const target = options.target ?? ">=20 <21";
  let changed = false;
  if (typeof parsed.engines?.node === "string") {
    const current = parsed.engines.node;
    const overlap = constraintOverlap(current, ">=16 <17");
    if (overlap === "all" || overlap === "partial" || /\b16\b/.test(current)) {
      parsed.engines.node = target;
      changed = true;
    }
  } else if (options.addIfMissing) {
    parsed.engines = { node: target, ...(parsed.engines ?? {}) };
    changed = true;
  }
  if (!changed) return null;
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function rewriteNodeVersionFile(content: string, target = "20"): string | null {
  const current = extractNodeVersionFile(content);
  if (!current || !/^16\b/.test(current)) return null;
  return `${target}\n`;
}

export function rewriteCiNodeVersion(content: string, target = "20"): string {
  return content.replace(
    /(node-version:\s*["']?)16(?:\.\d+)*(\.x)?(["']?)/gi,
    `$1${target}$3`,
  );
}
