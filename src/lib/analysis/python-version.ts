import { constraintOverlap } from "@/lib/analysis/php-version";

export function extractPythonVersionFile(content: string): string | null {
  const line = content.trim().split(/\r?\n/)[0] ?? "";
  const match = line.match(/(?:python-)?(\d+\.\d+(?:\.\d+)?)/i);
  return match?.[1] ?? null;
}

export function extractRequiresPython(content: string): string | null {
  const match =
    content.match(/requires-python\s*=\s*["']([^"']+)["']/i) ??
    content.match(/python_requires\s*=\s*["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export function extractCiPythonVersion(content: string): string | null {
  const match = content.match(/python-version:\s*['"]?(\d+\.\d+(?:\.\d+)?)['"]?/i);
  return match?.[1] ?? null;
}

export function rewritePythonVersionFile(content: string, target = "3.12"): string | null {
  const current = extractPythonVersionFile(content);
  if (!current || !/^3\.8\b/.test(current)) return null;
  if (/^python-/i.test(content.trim())) return `python-${target}\n`;
  return `${target}\n`;
}

export function rewriteRequiresPython(content: string, target = ">=3.12"): string | null {
  const current = extractRequiresPython(content);
  if (!current) return null;
  const overlap = constraintOverlap(current, ">=3.8 <3.9");
  if (overlap !== "all" && overlap !== "partial" && !/3\.8/.test(current)) return null;
  return content.replace(/requires-python\s*=\s*["'][^"']+["']/i, `requires-python = "${target}"`);
}

export function rewriteCiPythonVersion(content: string, target = "3.12"): string {
  return content.replace(
    /(python-version:\s*["']?)3\.8(?:\.\d+)?(["']?)/gi,
    `$1${target}$2`,
  );
}
