import { extractDockerImageTag } from "@/lib/analysis/docker-image";
import { advisoryEcosystem } from "@/lib/analysis/ecosystem";
import {
  extractCiNodeVersion,
  extractNodeEngines,
  extractNodeVersionFile,
} from "@/lib/analysis/node-version";
import {
  extractCiPhpVersion,
  extractComposerPhpConstraint,
  extractDockerfilePhp,
  versionSatisfies,
} from "@/lib/analysis/php-version";
import {
  extractCiPythonVersion,
  extractPythonVersionFile,
  extractRequiresPython,
} from "@/lib/analysis/python-version";
import { applyPatchCopy, describePatchedRuntime, findCiFile } from "@/lib/patches/generate";
import { findFile } from "@/lib/repo/inventory";
import type { CheckResult } from "@/lib/schemas";
import type { Scan } from "@/lib/store";

function result(
  name: string,
  status: CheckResult["status"],
  details: string,
  extra?: Partial<CheckResult>,
): CheckResult {
  return {
    name,
    status,
    details,
    exitCode: status === "pass" ? 0 : status === "fail" ? 1 : undefined,
    command: `static:${name}`,
    ...extra,
  };
}

function supportedPhp(value: string | null): boolean {
  return Boolean(value && (versionSatisfies(value, ">=8.2 <8.4") || /^8\.(2|3)/.test(value)));
}

function supportedNode(value: string | null): boolean {
  return Boolean(value && (versionSatisfies(value, ">=20 <21") || /^20\b/.test(value)));
}

function supportedPython(value: string | null): boolean {
  return Boolean(value && (versionSatisfies(value, ">=3.12 <3.13") || /^3\.12\b/.test(value)));
}

function pinCheck(args: {
  name: string;
  existed: boolean;
  hadPin: boolean;
  patched: boolean;
  value: string | null;
  missingFile: string;
  missingPin: string;
  ok: (value: string) => boolean;
  okText: (value: string) => string;
  failText: (value: string | null) => string;
}): CheckResult {
  if (!args.existed) {
    return result(args.name, "not_run", args.missingFile, { output: "" });
  }
  if (!args.hadPin && !args.patched) {
    return result(args.name, "not_run", args.missingPin, { output: "" });
  }
  const passed = Boolean(args.value && args.ok(args.value));
  return result(
    args.name,
    passed ? "pass" : "fail",
    passed && args.value ? args.okText(args.value) : args.failText(args.value),
    { output: args.value ?? "" },
  );
}

export function runAllowlistedChecks(scan: Scan): CheckResult[] {
  if (!scan.patch || scan.patch.hunks.length === 0) {
    return [
      {
        name: "patch_present",
        status: "not_run",
        details: "No patch hunks were generated, so runtime pin checks were not run.",
        command: "static:patch_present",
      },
    ];
  }

  const ecosystem = advisoryEcosystem(scan.advisory);
  const files = applyPatchCopy(scan);
  const pins = describePatchedRuntime(files);
  const patchedPaths = new Set(scan.patch.hunks.map((hunk) => hunk.path));
  if (ecosystem === "node") return nodeChecks(scan, pins, patchedPaths);
  if (ecosystem === "python") return pythonChecks(scan, pins, patchedPaths);

  const beforeDocker = findFile(scan.files, "Dockerfile");
  const beforeComposer = findFile(scan.files, "composer.json");
  const beforePhpVersion = findFile(scan.files, ".php-version");
  const beforeCi = findCiFile(scan.files);

  return [
    pinCheck({
      name: "dockerfile_runtime_pin",
      existed: Boolean(beforeDocker),
      hadPin: Boolean(beforeDocker && extractDockerfilePhp(beforeDocker.content)),
      patched: Boolean(beforeDocker && patchedPaths.has(beforeDocker.path)),
      value: pins.docker,
      missingFile: "No Dockerfile in the archive; skipped.",
      missingPin: "Dockerfile had no PHP image tag; skipped.",
      ok: supportedPhp,
      okText: (value) => `Patched Dockerfile image tag is php:${value}`,
      failText: (value) =>
        value ? `Patched Dockerfile is still php:${value}` : "Patched Dockerfile has no PHP image tag",
    }),
    pinCheck({
      name: "composer_php_constraint",
      existed: Boolean(beforeComposer),
      hadPin: Boolean(beforeComposer && extractComposerPhpConstraint(beforeComposer.content)),
      patched: Boolean(beforeComposer && patchedPaths.has(beforeComposer.path)),
      value: pins.composer,
      missingFile: "No composer.json in the archive; skipped.",
      missingPin: "composer.json had no PHP constraint and was not patched; skipped.",
      ok: (value) => /8\.(2|3)/.test(value),
      okText: (value) => `Patched composer.php constraint is ${value}`,
      failText: (value) =>
        value
          ? `Patched composer.php constraint is still ${value}`
          : "Patched composer.json has no PHP constraint",
    }),
    pinCheck({
      name: "php_version_file",
      existed: Boolean(beforePhpVersion),
      hadPin: Boolean(beforePhpVersion?.content.trim()),
      patched: Boolean(beforePhpVersion && patchedPaths.has(beforePhpVersion.path)),
      value: pins.phpVersion,
      missingFile: "No .php-version in the archive; skipped.",
      missingPin: ".php-version was not a pin in this archive; skipped.",
      ok: supportedPhp,
      okText: (value) => `.php-version is ${value}`,
      failText: (value) =>
        value ? `.php-version is still ${value}` : ".php-version missing after patch",
    }),
    pinCheck({
      name: "ci_php_version",
      existed: Boolean(beforeCi),
      hadPin: Boolean(beforeCi && extractCiPhpVersion(beforeCi.content)),
      patched: Boolean(beforeCi && patchedPaths.has(beforeCi.path)),
      value: pins.ci,
      missingFile: "No GitHub Actions workflow in the archive; skipped.",
      missingPin: "CI had no php-version pin; skipped.",
      ok: (value) => /^8\.(2|3)/.test(value),
      okText: (value) => `CI php-version is ${value}`,
      failText: (value) =>
        value ? `CI php-version is still ${value}` : "CI PHP version missing after patch",
    }),
    result(
      "no_application_source_rewrite",
      scan.patch.hunks.every((hunk) => !hunk.path.endsWith(".php") || hunk.path.startsWith("config/"))
        ? "pass"
        : "fail",
      "Application sources were left unchanged; this finding is a runtime pin change.",
    ),
  ];
}

function nodeChecks(
  scan: Scan,
  pins: ReturnType<typeof describePatchedRuntime>,
  patchedPaths: Set<string>,
): CheckResult[] {
  const beforeDocker = findFile(scan.files, "Dockerfile");
  const beforePkg = findFile(scan.files, "package.json");
  const beforeNvm = findFile(scan.files, ".nvmrc") ?? findFile(scan.files, ".node-version");
  const beforeCi = findCiFile(scan.files, extractCiNodeVersion);
  return [
    pinCheck({
      name: "dockerfile_runtime_pin",
      existed: Boolean(beforeDocker),
      hadPin: Boolean(beforeDocker && extractDockerImageTag(beforeDocker.content, "node")),
      patched: Boolean(beforeDocker && patchedPaths.has(beforeDocker.path)),
      value: pins.docker,
      missingFile: "No Dockerfile in the archive; skipped.",
      missingPin: "Dockerfile had no Node image tag; skipped.",
      ok: supportedNode,
      okText: (value) => `Patched Dockerfile image tag is node:${value}`,
      failText: (value) =>
        value ? `Patched Dockerfile is still node:${value}` : "Patched Dockerfile has no Node image tag",
    }),
    pinCheck({
      name: "engines_node_constraint",
      existed: Boolean(beforePkg),
      hadPin: Boolean(beforePkg && extractNodeEngines(beforePkg.content)),
      patched: Boolean(beforePkg && patchedPaths.has(beforePkg.path)),
      value: pins.nodeEngines,
      missingFile: "No package.json in the archive; skipped.",
      missingPin: "package.json had no engines.node and was not patched; skipped.",
      ok: (value) => /20/.test(value),
      okText: (value) => `Patched engines.node is ${value}`,
      failText: (value) =>
        value ? `Patched engines.node is still ${value}` : "Patched package.json has no engines.node",
    }),
    pinCheck({
      name: "node_version_file",
      existed: Boolean(beforeNvm),
      hadPin: Boolean(beforeNvm && extractNodeVersionFile(beforeNvm.content)),
      patched: Boolean(beforeNvm && patchedPaths.has(beforeNvm.path)),
      value: pins.nodeFile,
      missingFile: "No .nvmrc / .node-version in the archive; skipped.",
      missingPin: "Node version file was not a pin; skipped.",
      ok: supportedNode,
      okText: (value) => `Node version file is ${value}`,
      failText: (value) => (value ? `Node version file is still ${value}` : "Node version file missing after patch"),
    }),
    pinCheck({
      name: "ci_node_version",
      existed: Boolean(beforeCi),
      hadPin: Boolean(beforeCi && extractCiNodeVersion(beforeCi.content)),
      patched: Boolean(beforeCi && patchedPaths.has(beforeCi.path)),
      value: pins.ci,
      missingFile: "No GitHub Actions workflow in the archive; skipped.",
      missingPin: "CI had no node-version pin; skipped.",
      ok: supportedNode,
      okText: (value) => `CI node-version is ${value}`,
      failText: (value) => (value ? `CI node-version is still ${value}` : "CI Node version missing after patch"),
    }),
    result(
      "no_application_source_rewrite",
      scan.patch!.hunks.every((hunk) => !/\.(jsx?|tsx?|mjs|cjs)$/.test(hunk.path))
        ? "pass"
        : "fail",
      "Application sources were left unchanged; this finding is a runtime pin change.",
    ),
  ];
}

function pythonChecks(
  scan: Scan,
  pins: ReturnType<typeof describePatchedRuntime>,
  patchedPaths: Set<string>,
): CheckResult[] {
  const beforeDocker = findFile(scan.files, "Dockerfile");
  const beforeProject = findFile(scan.files, "pyproject.toml");
  const beforeFile = findFile(scan.files, "runtime.txt") ?? findFile(scan.files, ".python-version");
  const beforeCi = findCiFile(scan.files, extractCiPythonVersion);
  return [
    pinCheck({
      name: "dockerfile_runtime_pin",
      existed: Boolean(beforeDocker),
      hadPin: Boolean(beforeDocker && extractDockerImageTag(beforeDocker.content, "python")),
      patched: Boolean(beforeDocker && patchedPaths.has(beforeDocker.path)),
      value: pins.docker,
      missingFile: "No Dockerfile in the archive; skipped.",
      missingPin: "Dockerfile had no Python image tag; skipped.",
      ok: supportedPython,
      okText: (value) => `Patched Dockerfile image tag is python:${value}`,
      failText: (value) =>
        value ? `Patched Dockerfile is still python:${value}` : "Patched Dockerfile has no Python image tag",
    }),
    pinCheck({
      name: "requires_python",
      existed: Boolean(beforeProject),
      hadPin: Boolean(beforeProject && extractRequiresPython(beforeProject.content)),
      patched: Boolean(beforeProject && patchedPaths.has(beforeProject.path)),
      value: pins.requiresPython,
      missingFile: "No pyproject.toml in the archive; skipped.",
      missingPin: "pyproject.toml had no requires-python and was not patched; skipped.",
      ok: (value) => /3\.12/.test(value),
      okText: (value) => `Patched requires-python is ${value}`,
      failText: (value) =>
        value ? `Patched requires-python is still ${value}` : "Patched pyproject.toml has no requires-python",
    }),
    pinCheck({
      name: "python_version_file",
      existed: Boolean(beforeFile),
      hadPin: Boolean(beforeFile && extractPythonVersionFile(beforeFile.content)),
      patched: Boolean(beforeFile && patchedPaths.has(beforeFile.path)),
      value: pins.pythonFile,
      missingFile: "No runtime.txt / .python-version in the archive; skipped.",
      missingPin: "Python version file was not a pin; skipped.",
      ok: supportedPython,
      okText: (value) => `Python version file is ${value}`,
      failText: (value) =>
        value ? `Python version file is still ${value}` : "Python version file missing after patch",
    }),
    pinCheck({
      name: "ci_python_version",
      existed: Boolean(beforeCi),
      hadPin: Boolean(beforeCi && extractCiPythonVersion(beforeCi.content)),
      patched: Boolean(beforeCi && patchedPaths.has(beforeCi.path)),
      value: pins.ci,
      missingFile: "No GitHub Actions workflow in the archive; skipped.",
      missingPin: "CI had no python-version pin; skipped.",
      ok: supportedPython,
      okText: (value) => `CI python-version is ${value}`,
      failText: (value) =>
        value ? `CI python-version is still ${value}` : "CI Python version missing after patch",
    }),
    result(
      "no_application_source_rewrite",
      scan.patch!.hunks.every((hunk) => !hunk.path.endsWith(".py")) ? "pass" : "fail",
      "Application sources were left unchanged; this finding is a runtime pin change.",
    ),
  ];
}

export function applicableChecks(checks: CheckResult[]): CheckResult[] {
  return checks.filter((check) => check.status === "pass" || check.status === "fail");
}

export function applicableChecksPassed(checks: CheckResult[]): boolean {
  const applicable = applicableChecks(checks);
  return applicable.length > 0 && applicable.every((check) => check.status === "pass");
}
