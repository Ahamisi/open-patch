import { describe, expect, it } from "vitest";
import { loadAdvisory } from "@/lib/advisories/catalog";
import { assessExposure } from "@/lib/analysis/exposure";
import { toInventory } from "@/lib/repo/inventory";

const php74Files = [
  { path: "Dockerfile", content: "FROM php:7.4-apache\n" },
  { path: "composer.json", content: JSON.stringify({ require: { php: ">=7.4 <8.0" } }) },
  { path: ".php-version", content: "7.4.33\n" },
  { path: ".github/workflows/ci.yml", content: "php-version: '7.4'\n" },
  { path: "src/Invoice.php", content: "<?php\n" },
];

function bundle(files: { path: string; content: string }[]) {
  return toInventory(files, "test");
}

describe("assessExposure", () => {
  it("marks PHP 7.4 as affected for the EOL advisory", () => {
    const { files, evidence } = bundle(php74Files);
    const result = assessExposure(loadAdvisory("php-74-eol"), files, evidence);
    expect(result.status).toBe("affected");
    expect(result.detectedVersion).toBe("7.4");
  });

  it("marks PHP 8.3 as not_affected for the EOL advisory", () => {
    const { files, evidence } = bundle([
      { path: "Dockerfile", content: "FROM php:8.3-apache\n" },
      { path: ".php-version", content: "8.3.14\n" },
    ]);
    const result = assessExposure(loadAdvisory("php-74-eol"), files, evidence);
    expect(result.status).toBe("not_affected");
  });

  it("returns unknown when no runtime pin exists", () => {
    const { files, evidence } = bundle([{ path: "src/Invoice.php", content: "<?php\n" }]);
    const result = assessExposure(loadAdvisory("php-74-eol"), files, evidence);
    expect(result.status).toBe("unknown");
    expect(result.detectedVersion).toBeNull();
  });

  it("marks the Imagick advisory not_affected when the extension is absent", () => {
    const { files, evidence } = bundle(php74Files);
    const result = assessExposure(loadAdvisory("php-imagick-cve"), files, evidence);
    expect(result.status).toBe("not_affected");
  });

  it("marks the Windows CGI advisory unknown without a production OS", () => {
    const { files, evidence } = bundle(php74Files);
    const result = assessExposure(loadAdvisory("php-cgi-windows"), files, evidence);
    expect(result.status).toBe("unknown");
  });

  it("infers not_affected from a Composer ^8.2 constraint when no pin exists", () => {
    const { files, evidence } = bundle([
      { path: "composer.json", content: JSON.stringify({ require: { php: "^8.2" } }) },
    ]);
    const result = assessExposure(loadAdvisory("php-74-eol"), files, evidence);
    expect(result.status).toBe("not_affected");
  });

  it("marks Node 16 as affected for the Node EOL advisory", () => {
    const { files, evidence } = bundle([
      { path: "Dockerfile", content: "FROM node:16-alpine\n" },
      { path: "package.json", content: JSON.stringify({ engines: { node: "16" } }) },
    ]);
    const result = assessExposure(loadAdvisory("node-16-eol"), files, evidence);
    expect(result.status).toBe("affected");
    expect(result.detectedVersion).toBe("16");
  });

  it("marks Python 3.12 as not_affected for the 3.8 EOL advisory", () => {
    const { files, evidence } = bundle([
      { path: "Dockerfile", content: "FROM python:3.12-slim\n" },
    ]);
    const result = assessExposure(loadAdvisory("python-38-eol"), files, evidence);
    expect(result.status).toBe("not_affected");
  });

  it("returns unknown when a Composer constraint overlaps 7.4 and 8.x", () => {
    const { files, evidence } = bundle([
      { path: "composer.json", content: JSON.stringify({ require: { php: "^7.3|^8.0" } }) },
    ]);
    const result = assessExposure(loadAdvisory("php-74-eol"), files, evidence);
    expect(result.status).toBe("unknown");
  });
});
