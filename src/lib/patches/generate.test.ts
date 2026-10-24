import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { assessRemediationReadiness } from "@/lib/checks/readiness";
import { runAllowlistedChecks } from "@/lib/checks/run";
import { generateProposedPatch } from "@/lib/patches/generate";
import { toInventory } from "@/lib/repo/inventory";
import type { Scan } from "@/lib/store";

function scanFromFiles(
  files: { path: string; content: string }[],
  repoLabel: string,
  extra: Partial<Scan> = {},
): Scan {
  const inventory = toInventory(files, "test");
  const advisory = loadAdvisory("php-74-eol");
  const exposure = assessExposure(advisory, inventory.files, inventory.evidence);
  return {
    id: "test-scan",
    name: repoLabel,
    createdAt: new Date().toISOString(),
    repoSource: "upload",
    repoLabel,
    advisory,
    evidence: inventory.evidence,
    files: inventory.files,
    inspected: inventory.inspected,
    notInspected: inventory.notInspected,
    exposure,
    plan: null,
    planSource: null,
    planRequestId: null,
    patch: null,
    checks: [],
    verification: null,
    mubitCalls: [],
    ...extra,
  };
}

describe("generateProposedPatch", () => {
  it("rewrites Harbor Ledger pins and becomes review-ready", () => {
    const root = path.join(process.cwd(), "fixtures", "repos", "legacy-billing-php");
    const files = [
      "Dockerfile",
      "composer.json",
      ".php-version",
      ".github/workflows/ci.yml",
      "src/Invoice.php",
    ].map((rel) => ({
      path: rel,
      content: readFileSync(path.join(root, rel), "utf8"),
    }));
    const scan = scanFromFiles(files, "Harbor Ledger (synthetic fixture)");
    scan.patch = generateProposedPatch(scan);
    expect(scan.patch.prTitle).toContain("Harbor Ledger");
    expect(scan.patch.hunks.map((hunk) => hunk.path)).toEqual([
      "Dockerfile",
      "composer.json",
      ".php-version",
      ".github/workflows/ci.yml",
    ]);
    expect(scan.patch.hunks[0]?.after).toContain("FROM php:8.2-apache");
    scan.checks = runAllowlistedChecks(scan);
    expect(scan.checks.every((check) => check.status === "pass")).toBe(true);
    expect(assessRemediationReadiness(scan).status).toBe("review_ready");
  });

  it("patches phpOIDC-style Docker + missing Composer PHP without failing skipped pins", () => {
    const scan = scanFromFiles(
      [
        { path: "phpOIDC-master/Dockerfile", content: "FROM php:7.4-apache\nWORKDIR /var/www/\n" },
        {
          path: "phpOIDC-master/composer.json",
          content: JSON.stringify({ name: "r3dlin3/phpoidc", type: "project" }, null, 2),
        },
        {
          path: "phpOIDC-master/.github/workflows/docker.yml",
          content: "name: docker\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n",
        },
        { path: "phpOIDC-master/src/index.php", content: "<?php\n" },
      ],
      "phpOIDC public upload",
    );
    expect(scan.exposure.status).toBe("affected");
    scan.patch = generateProposedPatch(scan);
    expect(scan.patch.prTitle).toContain("phpOIDC public upload");
    expect(scan.patch.prTitle).not.toContain("Harbor Ledger");
    expect(scan.patch.hunks.map((hunk) => hunk.path)).toEqual([
      "phpOIDC-master/Dockerfile",
      "phpOIDC-master/composer.json",
    ]);
    expect(scan.patch.hunks[0]?.after).toContain("FROM php:8.2-apache");
    expect(scan.patch.hunks[1]?.after).toContain('"php": ">=8.2 <8.4"');
    scan.checks = runAllowlistedChecks(scan);
    const byName = Object.fromEntries(scan.checks.map((check) => [check.name, check.status]));
    expect(byName.dockerfile_runtime_pin).toBe("pass");
    expect(byName.composer_php_constraint).toBe("pass");
    expect(byName.php_version_file).toBe("not_run");
    expect(byName.ci_php_version).toBe("not_run");
    expect(byName.no_application_source_rewrite).toBe("pass");
    expect(assessRemediationReadiness(scan).status).toBe("review_ready");
  });

  it("patches a Node 16 Docker pin without rewriting application JS", () => {
    const scan = scanFromFiles(
      [
        { path: "Dockerfile", content: "FROM node:16-alpine\nWORKDIR /app\n" },
        { path: "package.json", content: JSON.stringify({ name: "demo", engines: { node: "16" } }) },
        { path: "src/server.js", content: "console.log('ok')\n" },
      ],
      "Node demo",
    );
    scan.advisory = loadAdvisory("node-16-eol");
    scan.exposure = assessExposure(scan.advisory, scan.files, scan.evidence);
    expect(scan.exposure.status).toBe("affected");
    scan.patch = generateProposedPatch(scan);
    expect(scan.patch.prTitle).toContain("Node 16");
    expect(scan.patch.hunks[0]?.after).toContain("FROM node:20-alpine");
    expect(scan.patch.hunks.every((hunk) => !hunk.path.endsWith(".js"))).toBe(true);
    scan.checks = runAllowlistedChecks(scan);
    expect(assessRemediationReadiness(scan).status).toBe("review_ready");
  });

  it("patches a Python 3.8 pin and skips missing CI", () => {
    const scan = scanFromFiles(
      [
        { path: "Dockerfile", content: "FROM python:3.8-slim\n" },
        { path: "runtime.txt", content: "python-3.8.18\n" },
        { path: "app.py", content: "print('ok')\n" },
      ],
      "Python demo",
    );
    scan.advisory = loadAdvisory("python-38-eol");
    scan.exposure = assessExposure(scan.advisory, scan.files, scan.evidence);
    expect(scan.exposure.status).toBe("affected");
    scan.patch = generateProposedPatch(scan);
    expect(scan.patch.hunks[0]?.after).toContain("FROM python:3.12-slim");
    expect(scan.patch.hunks.find((hunk) => hunk.path === "runtime.txt")?.after).toContain("3.12");
    scan.checks = runAllowlistedChecks(scan);
    expect(scan.checks.find((check) => check.name === "ci_python_version")?.status).toBe("not_run");
    expect(assessRemediationReadiness(scan).status).toBe("review_ready");
  });

  it("keeps the fpm-alpine variant on a lowercase dockerfile", () => {
    const scan = scanFromFiles(
      [
        { path: "PHP-Calculator-main/dockerfile", content: "FROM php:7.4-fpm-alpine\n" },
        {
          path: "PHP-Calculator-main/composer.json",
          content: JSON.stringify({
            require: { php: ">=7.4" },
            config: { platform: { php: "7.4.0" } },
          }),
        },
      ],
      "PHP-Calculator",
    );
    scan.patch = generateProposedPatch(scan);
    expect(scan.patch.hunks[0]?.path).toBe("PHP-Calculator-main/dockerfile");
    expect(scan.patch.hunks[0]?.after).toContain("FROM php:8.2-fpm-alpine");
    const composerAfter = scan.patch.hunks.find((hunk) => hunk.path.endsWith("composer.json"))?.after ?? "";
    expect(composerAfter).toContain(">=8.2 <8.4");
    expect(composerAfter).toContain("8.2.35");
    scan.checks = runAllowlistedChecks(scan);
    expect(assessRemediationReadiness(scan).status).toBe("review_ready");
  });
});
