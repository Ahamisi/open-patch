import AdmZip from "adm-zip";
import { ZIP_LIMITS } from "@/lib/config";
import { toInventory, type InventoryResult } from "@/lib/repo/inventory";
import type { RepoFile } from "@/lib/store";

const SKIP_DIR = /(^|\/)(vendor|node_modules|\.git|dist|build|\.idea)(\/|$)/;
const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|eot|mp[34]|sqlite|exe|dll)$/i;

function relevance(filePath: string): number {
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
    ].includes(base)
  ) {
    return 100;
  }
  if (
    base.toLowerCase() === "dockerfile" ||
    [".php-version", ".nvmrc", ".node-version", ".python-version", "runtime.txt"].includes(base)
  ) {
    return 95;
  }
  if (filePath.includes(".github/workflows/")) return 90;
  if (/docker-compose\.ya?ml$/i.test(base)) return 85;
  if (base === "README.md") return 40;
  if (filePath.endsWith(".php") && /(^|\/)(src|app|public|config|tests)\//.test(filePath)) {
    return 35;
  }
  if (filePath.endsWith(".php")) return 15;
  return 5;
}

export function inventoryFromZip(buffer: Buffer, sourceLabel: string): InventoryResult {
  if (buffer.byteLength > ZIP_LIMITS.maxBytes) {
    throw new Error(`ZIP exceeds ${ZIP_LIMITS.maxBytes} byte limit.`);
  }

  const zip = new AdmZip(buffer);
  const candidates: { path: string; data: Buffer; score: number }[] = [];
  const notInspected: string[] = [];

  for (const entry of zip.getEntries()) {
    const rawName = entry.entryName.replace(/\\/g, "/");
    if (rawName.includes("..") || rawName.startsWith("/") || rawName.includes(":")) {
      throw new Error(`Rejected unsafe ZIP path: ${rawName}`);
    }
    if (entry.isDirectory) continue;
    if (SKIP_DIR.test(rawName)) {
      notInspected.push(`${rawName} (directory skipped)`);
      continue;
    }
    if (BINARY_EXT.test(rawName)) {
      notInspected.push(`${rawName} (binary skipped)`);
      continue;
    }
    if ((entry.attr & 0o120000) === 0o120000) {
      notInspected.push(`${rawName} (symlink skipped)`);
      continue;
    }
    const depth = rawName.split("/").filter(Boolean).length;
    if (depth > ZIP_LIMITS.maxDepth) {
      notInspected.push(`${rawName} (path too deep)`);
      continue;
    }
    const data = entry.getData();
    if (data.byteLength > ZIP_LIMITS.maxFileBytes) {
      notInspected.push(`${rawName} (file too large)`);
      continue;
    }
    candidates.push({ path: rawName, data, score: relevance(rawName) });
  }

  candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const selected = candidates.slice(0, ZIP_LIMITS.maxFiles);
  if (candidates.length > selected.length) {
    notInspected.push(
      `${candidates.length - selected.length} lower-priority files skipped after the inspect cap`,
    );
  }

  const files: RepoFile[] = selected.map((item) => ({
    path: item.path,
    content: item.data.toString("utf8"),
  }));

  return toInventory(stripSharedRoot(files), sourceLabel, notInspected);
}

function stripSharedRoot(files: RepoFile[]): RepoFile[] {
  if (files.length === 0) return files;
  const first = files[0].path.split("/")[0];
  const shared = files.every((file) => file.path === first || file.path.startsWith(`${first}/`));
  if (!shared) return files;
  return files.map((file) => ({
    ...file,
    path: file.path === first ? file.path : file.path.slice(first.length + 1),
  }));
}
