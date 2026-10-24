import { extractDockerImageTag, rewriteDockerImageTag } from "@/lib/analysis/docker-image";
import { advisoryEcosystem } from "@/lib/analysis/ecosystem";
import {
  extractCiNodeVersion,
  extractNodeEngines,
  extractNodeVersionFile,
  rewriteCiNodeVersion,
  rewriteNodeEngines,
  rewriteNodeVersionFile,
} from "@/lib/analysis/node-version";
import {
  extractCiPhpVersion,
  extractComposerPhpConstraint,
  extractComposerPlatformPhp,
  extractDockerfilePhp,
  rewriteCiPhpVersion,
  rewriteComposerPhpPins,
  rewriteDockerfilePhp,
  rewritePhpVersionFile,
} from "@/lib/analysis/php-version";
import {
  extractCiPythonVersion,
  extractPythonVersionFile,
  extractRequiresPython,
  rewriteCiPythonVersion,
  rewritePythonVersionFile,
  rewriteRequiresPython,
} from "@/lib/analysis/python-version";
import { findFile } from "@/lib/repo/inventory";
import type { PatchHunk, ProposedPatch, RepoFile, Scan } from "@/lib/store";

function unified(path: string, before: string, after: string): string {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`),
  ].join("\n");
}

export function findCiFile(
  files: RepoFile[],
  extract: (content: string) => string | null = extractCiPhpVersion,
): RepoFile | undefined {
  const workflows = files.filter((file) => file.path.includes(".github/workflows/"));
  return workflows.find((file) => extract(file.content)) ?? workflows[0];
}

function repoName(scan: Scan): string {
  const generic = /^(uploaded zip|php scan|harbor ledger — weekend scan)$/i.test(
    scan.repoLabel.trim(),
  );
  const raw = generic ? scan.name : scan.repoLabel;
  return raw.replace(/\s+\(.*?\)\s*$/, "").trim() || scan.name;
}

function emptyPatch(scan: Scan): ProposedPatch {
  return {
    summary:
      "No automatic source or config patch is generated for this combination. The plan stays at investigation or a no-change finding.",
    unifiedDiff: "",
    hunks: [],
    prTitle: `chore: review ${scan.advisory.id} against ${repoName(scan)}`,
    prBody: [
      scan.exposure.reason,
      "",
      "Human approval is required. PatchPilot did not invent a runtime fix from missing evidence.",
    ].join("\n"),
  };
}

function finishPatch(scan: Scan, hunks: PatchHunk[], fromLabel: string, toLabel: string): ProposedPatch {
  const name = repoName(scan);
  return {
    summary:
      hunks.length > 0
        ? `Upgrade ${name} runtime pins from ${fromLabel} to ${toLabel}. Application source is left unchanged because this is a platform finding.`
        : `${fromLabel} exposure was detected, but no rewriteable runtime pin was present.`,
    unifiedDiff: hunks.map((hunk) => unified(hunk.path, hunk.before, hunk.after)).join("\n\n"),
    hunks,
    prTitle:
      hunks.length > 0
        ? `chore(runtime): upgrade ${name} from ${fromLabel} to ${toLabel}`
        : `chore: review ${fromLabel} exposure for ${name}`,
    prBody: [
      "## Why",
      scan.exposure.reason,
      "",
      "## What changes",
      ...(hunks.length > 0
        ? hunks.map((hunk) => `- ${hunk.path}: ${hunk.reason}`)
        : ["- No rewriteable pin files were found."]),
      "",
      "## Checks",
      "Allowlisted static checks only. Files that were not pins are skipped, not failed.",
      "Package-manager scripts and container builds are not executed.",
      "",
      "Human approval required. Do not merge automatically.",
    ].join("\n"),
  };
}

export function generateProposedPatch(scan: Scan): ProposedPatch {
  if (scan.exposure.status !== "affected") return emptyPatch(scan);
  const ecosystem = advisoryEcosystem(scan.advisory);
  if (scan.advisory.id === "node-16-eol" || ecosystem === "node") {
    return generateNodePatch(scan);
  }
  if (scan.advisory.id === "python-38-eol" || ecosystem === "python") {
    return generatePythonPatch(scan);
  }
  if (scan.advisory.id !== "php-74-eol") return emptyPatch(scan);
  return generatePhpPatch(scan);
}

function generatePhpPatch(scan: Scan): ProposedPatch {
  const dockerfile = findFile(scan.files, "Dockerfile");
  const composer = findFile(scan.files, "composer.json");
  const phpVersion = findFile(scan.files, ".php-version");
  const ci = findCiFile(scan.files);
  const hunks: PatchHunk[] = [];
  const dockerPin = dockerfile ? extractDockerfilePhp(dockerfile.content) : null;
  const hasExactRuntimePin = Boolean(
    dockerPin ||
      phpVersion?.content.trim() ||
      (composer && extractComposerPlatformPhp(composer.content)) ||
      (ci && extractCiPhpVersion(ci.content)),
  );

  if (dockerfile) {
    const after = rewriteDockerfilePhp(dockerfile.content);
    if (after !== dockerfile.content) {
      hunks.push({
        path: dockerfile.path,
        reason: `Runtime image tag ${dockerPin ? `php:${dockerPin}` : "7.4"} must move off the EOL 7.4 line.`,
        evidenceIds: scan.exposure.evidenceIds,
        before: dockerfile.content,
        after,
      });
    }
  }

  if (composer) {
    const after = rewriteComposerPhpPins(composer.content, {
      addRequireIfMissing: hasExactRuntimePin,
    });
    if (after && after !== composer.content) {
      const added = !extractComposerPhpConstraint(composer.content);
      hunks.push({
        path: composer.path,
        reason: added
          ? "Composer had no PHP constraint. Adding require.php so the next install matches the upgraded runtime."
          : "Composer PHP constraint / platform pin must match the supported runtime.",
        evidenceIds: scan.exposure.evidenceIds,
        before: composer.content,
        after,
      });
    }
  }

  if (phpVersion) {
    const after = rewritePhpVersionFile(phpVersion.content);
    if (after && after !== phpVersion.content) {
      hunks.push({
        path: phpVersion.path,
        reason: ".php-version is a confirmed runtime pin.",
        evidenceIds: scan.exposure.evidenceIds,
        before: phpVersion.content,
        after,
      });
    }
  }

  if (ci) {
    const after = rewriteCiPhpVersion(ci.content);
    if (after !== ci.content) {
      hunks.push({
        path: ci.path,
        reason: "CI must exercise the same supported PHP version.",
        evidenceIds: scan.exposure.evidenceIds,
        before: ci.content,
        after,
      });
    }
  }

  return finishPatch(scan, hunks, "PHP 7.4", "PHP 8.2");
}

function generateNodePatch(scan: Scan): ProposedPatch {
  const dockerfile = findFile(scan.files, "Dockerfile");
  const pkg = findFile(scan.files, "package.json");
  const nvmrc = findFile(scan.files, ".nvmrc");
  const nodeVersion = findFile(scan.files, ".node-version");
  const ci = findCiFile(scan.files, extractCiNodeVersion);
  const hunks: PatchHunk[] = [];
  const dockerPin = dockerfile ? extractDockerImageTag(dockerfile.content, "node") : null;
  const hasExact = Boolean(
    dockerPin ||
      (nvmrc && extractNodeVersionFile(nvmrc.content)) ||
      (nodeVersion && extractNodeVersionFile(nodeVersion.content)) ||
      (ci && extractCiNodeVersion(ci.content)),
  );

  if (dockerfile) {
    const after = rewriteDockerImageTag(dockerfile.content, "node", "16", "20");
    if (after !== dockerfile.content) {
      hunks.push({
        path: dockerfile.path,
        reason: `Runtime image tag ${dockerPin ? `node:${dockerPin}` : "16"} must move off the EOL Node 16 line.`,
        evidenceIds: scan.exposure.evidenceIds,
        before: dockerfile.content,
        after,
      });
    }
  }
  if (pkg) {
    const after = rewriteNodeEngines(pkg.content, { addIfMissing: hasExact });
    if (after && after !== pkg.content) {
      hunks.push({
        path: pkg.path,
        reason: extractNodeEngines(pkg.content)
          ? "package.json engines.node must match the supported runtime."
          : "package.json had no engines.node. Adding one so installs match the upgraded runtime.",
        evidenceIds: scan.exposure.evidenceIds,
        before: pkg.content,
        after,
      });
    }
  }
  for (const file of [nvmrc, nodeVersion]) {
    if (!file) continue;
    const after = rewriteNodeVersionFile(file.content);
    if (after && after !== file.content) {
      hunks.push({
        path: file.path,
        reason: `${file.path.split("/").pop()} is a confirmed Node pin.`,
        evidenceIds: scan.exposure.evidenceIds,
        before: file.content,
        after,
      });
    }
  }
  if (ci) {
    const after = rewriteCiNodeVersion(ci.content);
    if (after !== ci.content) {
      hunks.push({
        path: ci.path,
        reason: "CI must exercise the same supported Node version.",
        evidenceIds: scan.exposure.evidenceIds,
        before: ci.content,
        after,
      });
    }
  }
  return finishPatch(scan, hunks, "Node 16", "Node 20");
}

function generatePythonPatch(scan: Scan): ProposedPatch {
  const dockerfile = findFile(scan.files, "Dockerfile");
  const pyproject = findFile(scan.files, "pyproject.toml");
  const runtime = findFile(scan.files, "runtime.txt");
  const pythonVersion = findFile(scan.files, ".python-version");
  const ci = findCiFile(scan.files, extractCiPythonVersion);
  const hunks: PatchHunk[] = [];
  const dockerPin = dockerfile ? extractDockerImageTag(dockerfile.content, "python") : null;

  if (dockerfile) {
    const after = rewriteDockerImageTag(dockerfile.content, "python", "3.8", "3.12");
    if (after !== dockerfile.content) {
      hunks.push({
        path: dockerfile.path,
        reason: `Runtime image tag ${dockerPin ? `python:${dockerPin}` : "3.8"} must move off the EOL 3.8 line.`,
        evidenceIds: scan.exposure.evidenceIds,
        before: dockerfile.content,
        after,
      });
    }
  }
  if (pyproject) {
    const after = rewriteRequiresPython(pyproject.content);
    if (after && after !== pyproject.content) {
      hunks.push({
        path: pyproject.path,
        reason: "requires-python must match the supported runtime.",
        evidenceIds: scan.exposure.evidenceIds,
        before: pyproject.content,
        after,
      });
    }
  }
  for (const file of [runtime, pythonVersion]) {
    if (!file) continue;
    const after = rewritePythonVersionFile(file.content);
    if (after && after !== file.content) {
      hunks.push({
        path: file.path,
        reason: `${file.path.split("/").pop()} is a confirmed Python pin.`,
        evidenceIds: scan.exposure.evidenceIds,
        before: file.content,
        after,
      });
    }
  }
  if (ci) {
    const after = rewriteCiPythonVersion(ci.content);
    if (after !== ci.content) {
      hunks.push({
        path: ci.path,
        reason: "CI must exercise the same supported Python version.",
        evidenceIds: scan.exposure.evidenceIds,
        before: ci.content,
        after,
      });
    }
  }
  return finishPatch(scan, hunks, "Python 3.8", "Python 3.12");
}

export function applyPatchCopy(scan: Scan): RepoFile[] {
  if (!scan.patch) return scan.files;
  const replacements = new Map(scan.patch.hunks.map((hunk) => [hunk.path, hunk.after]));
  return scan.files.map((file) => ({
    path: file.path,
    content: replacements.get(file.path) ?? file.content,
  }));
}

export function describePatchedRuntime(files: RepoFile[]) {
  const dockerfile = findFile(files, "Dockerfile");
  const composer = findFile(files, "composer.json");
  const phpVersion = findFile(files, ".php-version");
  const pkg = findFile(files, "package.json");
  const nvmrc = findFile(files, ".nvmrc");
  const nodeVersion = findFile(files, ".node-version");
  const pyproject = findFile(files, "pyproject.toml");
  const runtime = findFile(files, "runtime.txt");
  const pythonVersion = findFile(files, ".python-version");
  const phpCi = findCiFile(files, extractCiPhpVersion);
  const nodeCi = findCiFile(files, extractCiNodeVersion);
  const pythonCi = findCiFile(files, extractCiPythonVersion);
  return {
    docker:
      (dockerfile &&
        (extractDockerfilePhp(dockerfile.content) ||
          extractDockerImageTag(dockerfile.content, "node") ||
          extractDockerImageTag(dockerfile.content, "python"))) ??
      null,
    composer: composer ? extractComposerPhpConstraint(composer.content) : null,
    platform: composer ? extractComposerPlatformPhp(composer.content) : null,
    phpVersion: phpVersion?.content.trim() ?? null,
    ci:
      (phpCi && extractCiPhpVersion(phpCi.content)) ||
      (nodeCi && extractCiNodeVersion(nodeCi.content)) ||
      (pythonCi && extractCiPythonVersion(pythonCi.content)) ||
      null,
    nodeEngines: pkg ? extractNodeEngines(pkg.content) : null,
    nodeFile:
      (nvmrc ? extractNodeVersionFile(nvmrc.content) : null) ??
      (nodeVersion ? extractNodeVersionFile(nodeVersion.content) : null),
    requiresPython: pyproject ? extractRequiresPython(pyproject.content) : null,
    pythonFile:
      (runtime ? extractPythonVersionFile(runtime.content) : null) ??
      (pythonVersion ? extractPythonVersionFile(pythonVersion.content) : null),
  };
}
