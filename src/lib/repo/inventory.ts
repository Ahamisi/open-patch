import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ZIP_LIMITS } from "@/lib/config";
import type { RepositoryEvidence } from "@/lib/schemas";
import type { RepoFile } from "@/lib/store";

const SKIP_DIRS = new Set([".git", "node_modules", "vendor", ".next"]);

export type InventoryResult = {
  files: RepoFile[];
  evidence: RepositoryEvidence[];
  inspected: string[];
  notInspected: string[];
};

function classify(filePath: string): RepositoryEvidence["kind"] {
  const base = filePath.split("/").pop() ?? filePath;
  if (
    [
      "composer.json",
      "composer.lock",
      "package.json",
      "package-lock.json",
      "pyproject.toml",
      "requirements.txt",
      "go.mod",
      "pom.xml",
      "Gemfile",
    ].includes(base)
  ) {
    return "manifest";
  }
  if (
    base.toLowerCase() === "dockerfile" ||
    [".php-version", ".nvmrc", ".node-version", ".python-version", "runtime.txt", ".ruby-version"].includes(
      base,
    ) ||
    filePath.includes("docker-compose")
  ) {
    return "runtime_config";
  }
  if (filePath.includes(".github/workflows/") || /\.ya?ml$/i.test(base)) return "ci";
  if (filePath.startsWith("tests/") || /test/i.test(base)) return "test";
  if (filePath.endsWith(".php")) return "source";
  return "other";
}

function fingerprint(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function collectFromDisk(root: string, sourceLabel: string): InventoryResult {
  const files: RepoFile[] = [];
  const notInspected: string[] = [];

  const walk = (abs: string, rel: string, depth: number) => {
    if (depth > ZIP_LIMITS.maxDepth) {
      notInspected.push(`${rel} (path too deep)`);
      return;
    }
    const entries = readdirSync(abs);
    for (const entry of entries) {
      const childAbs = path.join(abs, entry);
      const childRel = rel ? `${rel}/${entry}` : entry;
      const stat = statSync(childAbs);
      if (stat.isSymbolicLink()) {
        notInspected.push(`${childRel} (symlink skipped)`);
        continue;
      }
      if (stat.isDirectory()) {
        if (SKIP_DIRS.has(entry)) {
          notInspected.push(`${childRel} (directory skipped)`);
          continue;
        }
        walk(childAbs, childRel, depth + 1);
        continue;
      }
      if (files.length >= ZIP_LIMITS.maxFiles) {
        notInspected.push(`${childRel} (file count limit)`);
        continue;
      }
      if (stat.size > ZIP_LIMITS.maxFileBytes) {
        notInspected.push(`${childRel} (file too large)`);
        continue;
      }
      const content = readFileSync(childAbs, "utf8");
      files.push({ path: childRel, content });
    }
  };

  walk(root, "", 0);
  return toInventory(files, sourceLabel, notInspected);
}

export function toInventory(
  files: RepoFile[],
  sourceLabel: string,
  notInspected: string[] = [],
): InventoryResult {
  const collectedAt = new Date().toISOString();
  const evidence: RepositoryEvidence[] = files.map((file, index) => ({
    id: `ev-${String(index + 1).padStart(3, "0")}`,
    path: file.path,
    kind: classify(file.path),
    excerpt: file.content.slice(0, ZIP_LIMITS.maxExcerpt),
    sha256: fingerprint(file.content),
    sourceLabel,
    confidence: "confirmed",
    collectedAt,
  }));

  return {
    files,
    evidence,
    inspected: files.map((file) => file.path),
    notInspected,
  };
}

export function findFile(files: RepoFile[], name: string): RepoFile | undefined {
  const lower = name.toLowerCase();
  const matches = files.filter((file) => {
    const base = file.path.split("/").pop() ?? file.path;
    return base.toLowerCase() === lower;
  });
  return matches.sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0];
}
