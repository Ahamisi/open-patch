/**
 * A real `git apply`-able unified diff between two versions of one file.
 * Line-level LCS with 3 lines of context. Pin files are small (Dockerfile, composer.json,
 * .php-version, CI YAML), so the O(n·m) table is fine; very large inputs fall back to a
 * whole-file replacement, which is still a valid patch.
 */

const CONTEXT = 3;
const MAX_CELLS = 4_000_000;

type Op = { kind: " " | "-" | "+"; text: string };

function splitLines(content: string): { lines: string[]; trailingNewline: boolean } {
  if (content === "") return { lines: [], trailingNewline: true };
  const trailingNewline = content.endsWith("\n");
  const body = trailingNewline ? content.slice(0, -1) : content;
  return { lines: body.split("\n"), trailingNewline };
}

function diffOps(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  if ((n + 1) * (m + 1) > MAX_CELLS) {
    return [...a.map((text) => ({ kind: "-" as const, text })), ...b.map((text) => ({ kind: "+" as const, text }))];
  }
  const table: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: " ", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ kind: "-", text: a[i] });
      i += 1;
    } else {
      ops.push({ kind: "+", text: b[j] });
      j += 1;
    }
  }
  while (i < n) ops.push({ kind: "-", text: a[i++] });
  while (j < m) ops.push({ kind: "+", text: b[j++] });
  return ops;
}

export type DiffLine = { kind: " " | "-" | "+" | "@"; text: string };

/** Hunks as display lines (for the UI) — same content as the patch body. */
export function diffHunks(before: string, after: string): DiffLine[][] {
  const a = splitLines(before);
  const b = splitLines(after);
  const ops = diffOps(a.lines, b.lines);
  if (!ops.some((op) => op.kind !== " ") && a.trailingNewline === b.trailingNewline) return [];
  if (a.lines.length === 0 && b.lines.length === 0) return [];

  // A line missing its final newline can stay a shared context line only when it is the
  // last line of both files and both lack the newline. Otherwise split it into -/+.
  const lastIndex = (keep: (op: Op) => boolean) => {
    for (let index = ops.length - 1; index >= 0; index -= 1) if (keep(ops[index])) return index;
    return -1;
  };
  for (let pass = 0; pass < 2; pass += 1) {
    const lastOld = lastIndex((op) => op.kind !== "+");
    const lastNew = lastIndex((op) => op.kind !== "-");
    const sharedEnd = lastOld === lastNew && !a.trailingNewline && !b.trailingNewline;
    const target =
      !a.trailingNewline && lastOld >= 0 && ops[lastOld].kind === " " && !sharedEnd
        ? lastOld
        : !b.trailingNewline && lastNew >= 0 && ops[lastNew].kind === " " && !sharedEnd
          ? lastNew
          : -1;
    if (target < 0) break;
    const text = ops[target].text;
    ops.splice(target, 1, { kind: "-", text }, { kind: "+", text });
  }

  // Index of each op in old/new line numbering.
  const positions: { oldLine: number; newLine: number }[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const op of ops) {
    positions.push({ oldLine, newLine });
    if (op.kind !== "+") oldLine += 1;
    if (op.kind !== "-") newLine += 1;
  }

  const changed = ops.map((op, index) => (op.kind === " " ? -1 : index)).filter((index) => index >= 0);
  const groups: [number, number][] = [];
  for (const index of changed) {
    const start = Math.max(0, index - CONTEXT);
    const end = Math.min(ops.length - 1, index + CONTEXT);
    const previous = groups[groups.length - 1];
    if (previous && start <= previous[1] + 1) previous[1] = Math.max(previous[1], end);
    else groups.push([start, end]);
  }

  const lastOldIndex = ops.map((op, index) => (op.kind !== "+" ? index : -1)).filter((index) => index >= 0).pop();
  const lastNewIndex = ops.map((op, index) => (op.kind !== "-" ? index : -1)).filter((index) => index >= 0).pop();

  return groups.map(([start, end]) => {
    const slice = ops.slice(start, end + 1);
    const oldCount = slice.filter((op) => op.kind !== "+").length;
    const newCount = slice.filter((op) => op.kind !== "-").length;
    const oldStart = oldCount === 0 ? positions[start].oldLine - 1 : positions[start].oldLine;
    const newStart = newCount === 0 ? positions[start].newLine - 1 : positions[start].newLine;
    const lines: DiffLine[] = [
      { kind: "@", text: `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@` },
    ];
    slice.forEach((op, offset) => {
      const index = start + offset;
      lines.push({ kind: op.kind, text: op.text });
      const endsOld = index === lastOldIndex && !a.trailingNewline && op.kind !== "+";
      const endsNew = index === lastNewIndex && !b.trailingNewline && op.kind !== "-";
      if (endsOld || endsNew) lines.push({ kind: "@", text: "\\ No newline at end of file" });
    });
    return lines;
  });
}

/** One file's section of a git patch, or "" when nothing changed. */
export function unifiedFileDiff(path: string, before: string, after: string): string {
  const hunks = diffHunks(before, after);
  if (hunks.length === 0) return "";
  const body = hunks
    .flat()
    .map((line) => (line.kind === "@" ? line.text : `${line.kind}${line.text}`))
    .join("\n");
  return [`diff --git a/${path} b/${path}`, `--- a/${path}`, `+++ b/${path}`, body].join("\n") + "\n";
}

/** A whole patch for several files, ready for `git apply`. */
export function unifiedPatch(files: { path: string; before: string; after: string }[]): string {
  return files.map((file) => unifiedFileDiff(file.path, file.before, file.after)).filter(Boolean).join("");
}
