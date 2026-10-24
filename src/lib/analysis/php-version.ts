export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
};

const VERSION_RE = /(\d+)(?:\.(\d+)(?:\.(\d+))?)?/;

export function parsePhpVersion(input: string | null | undefined): ParsedVersion | null {
  if (!input) return null;
  const match = input.match(VERSION_RE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: match[2] ? Number(match[2]) : 0,
    patch: match[3] ? Number(match[3]) : 0,
  };
}

export function formatPhpVersion(version: ParsedVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function comparePhpVersion(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function matchesComparator(
  version: ParsedVersion,
  operator: string,
  target: ParsedVersion,
): boolean {
  const cmp = comparePhpVersion(version, target);
  switch (operator) {
    case ">":
      return cmp > 0;
    case ">=":
      return cmp >= 0;
    case "<":
      return cmp < 0;
    case "<=":
      return cmp <= 0;
    case "=":
    case "==":
      return cmp === 0;
    default:
      return false;
  }
}

/**
 * Supports Composer-like constraints used by the seeded advisories:
 * `7.4.33`, `7.4.x`, `>=7.4 <8.0`, `<8.1.31`, `^7.4`.
 * Returns null when the range cannot be evaluated.
 */
export function versionSatisfies(
  versionRaw: string | null | undefined,
  rangeRaw: string | null | undefined,
): boolean | null {
  const version = parsePhpVersion(versionRaw);
  if (!version || !rangeRaw?.trim()) return null;

  const range = rangeRaw.trim();
  if (/^\d+\.x$/.test(range)) {
    return version.major === Number(range.split(".")[0]);
  }

  if (/^\d+\.\d+\.x$/.test(range)) {
    const [major, minor] = range.split(".");
    return version.major === Number(major) && version.minor === Number(minor);
  }

  if (/^\d+(?:\.\d+(?:\.\d+)?)?$/.test(range)) {
    const target = parsePhpVersion(range);
    return target ? comparePhpVersion(version, target) === 0 : null;
  }

  if (range.includes("|")) {
    const branches = range.split(/\|\|?/).map((part) => part.trim()).filter(Boolean);
    const results = branches.map((branch) => versionSatisfies(versionRaw, branch));
    if (results.every((item) => item === null)) return null;
    return results.some(Boolean);
  }

  const clauses = range.split(/\s+/).filter(Boolean);
  if (clauses.length === 0) return null;

  return clauses.every((clause) => {
    const caretMajor = clause.match(/^\^(\d+)$/);
    if (caretMajor) {
      return version.major === Number(caretMajor[1]);
    }

    const caret = clause.match(/^\^(\d+)\.(\d+)(?:\.(\d+))?$/);
    if (caret) {
      const lower = {
        major: Number(caret[1]),
        minor: Number(caret[2]),
        patch: caret[3] ? Number(caret[3]) : 0,
      };
      const upper = { major: lower.major + 1, minor: 0, patch: 0 };
      return (
        comparePhpVersion(version, lower) >= 0 &&
        comparePhpVersion(version, upper) < 0
      );
    }

    const tagged = clause.match(/^(>=|<=|>|<|==|=)(\d+(?:\.\d+(?:\.\d+)?)?)$/);
    if (!tagged) return false;
    const target = parsePhpVersion(tagged[2]);
    return target ? matchesComparator(version, tagged[1], target) : false;
  });
}

export function extractDockerfilePhp(content: string): string | null {
  const match = content.match(/FROM\s+php:(\d+\.\d+(?:\.\d+)?)/i);
  return match?.[1] ?? null;
}

/** Keep the image variant (apache, fpm-alpine, cli) and move only the 7.4 tag. */
export function rewriteDockerfilePhp(content: string, targetMinor = "8.2"): string {
  return content.replace(
    /FROM(\s+)php:7\.4(?:\.\d+)?(-[^\s]+)?/gi,
    (_match, whitespace: string, variant?: string) =>
      `FROM${whitespace}php:${targetMinor}${variant ?? ""}`,
  );
}

export function rewriteCiPhpVersion(content: string, targetMinor = "8.2"): string {
  return content.replace(
    /(php-version:\s*["']?)7\.4(?:\.\d+)?(["']?)/gi,
    `$1${targetMinor}$2`,
  );
}

export function rewritePhpVersionFile(content: string, target = "8.2.35"): string | null {
  const current = content.trim();
  if (!/^7\.4(?:\.\d+)?$/.test(current)) return null;
  return `${target}\n`;
}

export function rewriteComposerPhpPins(
  content: string,
  options: { addRequireIfMissing: boolean; targetConstraint?: string; targetPlatform?: string },
): string | null {
  let parsed: {
    require?: Record<string, string>;
    config?: { platform?: { php?: string } };
  };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const targetConstraint = options.targetConstraint ?? ">=8.2 <8.4";
  const targetPlatform = options.targetPlatform ?? "8.2.35";
  let changed = false;

  if (typeof parsed.require?.php === "string") {
    const current = parsed.require.php;
    const overlap = constraintOverlap(current, ">=7.4 <8.0");
    if (overlap === "all" || overlap === "partial" || /7\.4/.test(current)) {
      parsed.require.php = targetConstraint;
      changed = true;
    }
  } else if (options.addRequireIfMissing) {
    parsed.require = { php: targetConstraint, ...(parsed.require ?? {}) };
    changed = true;
  }

  if (typeof parsed.config?.platform?.php === "string" && /7\.\d/.test(parsed.config.platform.php)) {
    parsed.config.platform.php = targetPlatform;
    changed = true;
  }

  if (!changed) return null;
  return editComposerInPlace(content, parsed) ?? `${JSON.stringify(parsed, null, 2)}\n`;
}

/**
 * Change only the "php" string values in the original text so the diff a reviewer sees is
 * one or two lines, not a re-indented file. Returns null when the in-place edit cannot
 * reproduce `desired` exactly (for example, a key had to be added); the caller then falls
 * back to re-serialising.
 */
function editComposerInPlace(
  original: string,
  desired: { require?: Record<string, string>; config?: { platform?: { php?: string } } },
): string | null {
  const pattern = /("php"\s*:\s*)"((?:[^"\\]|\\.)*)"/g;
  const matches = [...original.matchAll(pattern)];
  if (matches.length === 0) return insertRequirePhp(original, desired);
  const marker = "__open_patch_marker__";
  let result = "";
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? 0;
    const probe = original.slice(0, index) + `${match[1]}"${marker}"` + original.slice(index + match[0].length);
    let parsedProbe: { require?: { php?: string }; config?: { platform?: { php?: string } } };
    try {
      parsedProbe = JSON.parse(probe);
    } catch {
      return null;
    }
    let value: string | undefined;
    if (parsedProbe.require?.php === marker) value = desired.require?.php;
    else if (parsedProbe.config?.platform?.php === marker) value = desired.config?.platform?.php;
    result += original.slice(cursor, index);
    result += value === undefined ? match[0] : `${match[1]}${JSON.stringify(value)}`;
    cursor = index + match[0].length;
  }
  result += original.slice(cursor);
  try {
    return JSON.stringify(JSON.parse(result)) === JSON.stringify(desired) ? result : null;
  } catch {
    return null;
  }
}

/** Add "php" as the first key of an existing "require" object, matching its indentation. */
function insertRequirePhp(
  original: string,
  desired: { require?: Record<string, string> },
): string | null {
  const value = desired.require?.php;
  if (value === undefined) return null;
  const open = /"require"\s*:\s*\{/.exec(original);
  if (!open) return null;
  const at = open.index + open[0].length;
  const rest = original.slice(at);
  const nextLine = /^\s*?\n([ \t]*)\S/.exec(rest);
  const isEmpty = /^\s*\}/.test(rest);
  const entry = `"php": ${JSON.stringify(value)}`;
  const insertion = nextLine
    ? `\n${nextLine[1]}${entry}${isEmpty ? "" : ","}`
    : ` ${entry}${isEmpty ? "" : ","}`;
  const result = original.slice(0, at) + insertion + rest;
  try {
    return JSON.stringify(JSON.parse(result)) === JSON.stringify(desired) ? result : null;
  } catch {
    return null;
  }
}

export function extractComposerPhpConstraint(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as {
      require?: { php?: string };
      config?: { platform?: { php?: string } };
    };
    return parsed.require?.php ?? parsed.config?.platform?.php ?? null;
  } catch {
    return null;
  }
}

export function extractComposerPlatformPhp(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as {
      config?: { platform?: { php?: string } };
      "platform-overrides"?: { php?: string };
    };
    return (
      parsed.config?.platform?.php ??
      parsed["platform-overrides"]?.php ??
      null
    );
  } catch {
    return null;
  }
}

export function extractCiPhpVersion(content: string): string | null {
  const match = content.match(/php-version:\s*['"]?(\d+\.\d+(?:\.\d+)?)['"]?/i);
  return match?.[1] ?? null;
}

export function mentionsImagick(content: string): boolean {
  return /imagick|ext-imagick/i.test(content);
}

const PROBE_VERSIONS = [
  "7.3.33",
  "7.4.33",
  "8.0.30",
  "8.1.31",
  "8.2.26",
  "8.3.14",
  "8.4.1",
  "16.20.2",
  "18.20.4",
  "20.18.0",
  "22.11.0",
  "3.8.18",
  "3.9.21",
  "3.10.15",
  "3.11.10",
  "3.12.7",
];

export type ConstraintOverlap = "all" | "none" | "partial" | "unknown";

/** Compare a Composer constraint to an advisory range using probe versions. */
export function constraintOverlap(
  composerConstraint: string | null | undefined,
  affectedRange: string | null | undefined,
): ConstraintOverlap {
  if (!composerConstraint || !affectedRange) return "unknown";
  const allowed = PROBE_VERSIONS.filter(
    (version) => versionSatisfies(version, composerConstraint) === true,
  );
  if (allowed.length === 0) return "unknown";
  const hits = allowed.filter((version) => versionSatisfies(version, affectedRange) === true);
  if (hits.length === 0) return "none";
  if (hits.length === allowed.length) return "all";
  return "partial";
}
