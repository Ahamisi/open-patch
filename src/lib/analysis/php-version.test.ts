import { describe, expect, it } from "vitest";
import {
  constraintOverlap,
  rewriteComposerPhpPins,
  rewriteDockerfilePhp,
  versionSatisfies,
} from "@/lib/analysis/php-version";

describe("versionSatisfies", () => {
  it("treats PHP 7.4.33 as inside the EOL range", () => {
    expect(versionSatisfies("7.4.33", ">=7.4 <8.0")).toBe(true);
  });

  it("treats PHP 8.3.14 as outside the EOL range", () => {
    expect(versionSatisfies("8.3.14", ">=7.4 <8.0")).toBe(false);
  });

  it("returns null when the runtime version is missing", () => {
    expect(versionSatisfies(null, ">=7.4 <8.0")).toBeNull();
  });

  it("understands a 7.4.x wildcard", () => {
    expect(versionSatisfies("7.4.21", "7.4.x")).toBe(true);
    expect(versionSatisfies("8.2.0", "7.4.x")).toBe(false);
  });

  it("understands Node major-only pins", () => {
    expect(versionSatisfies("16", ">=16 <17")).toBe(true);
    expect(versionSatisfies("20.18.0", ">=16 <17")).toBe(false);
    expect(versionSatisfies("16.20.2", "^16")).toBe(true);
  });
});

describe("constraintOverlap", () => {
  it("treats ^8.2 as outside the 7.4 EOL range", () => {
    expect(constraintOverlap("^8.2", ">=7.4 <8.0")).toBe("none");
  });

  it("treats ^7.3|^8.0 as a partial overlap with 7.4 EOL", () => {
    expect(constraintOverlap("^7.3|^8.0", ">=7.4 <8.0")).toBe("partial");
  });
});

describe("runtime rewrites", () => {
  it("keeps the Docker variant when moving off 7.4", () => {
    expect(rewriteDockerfilePhp("FROM php:7.4-fpm-alpine\n")).toBe("FROM php:8.2-fpm-alpine\n");
    expect(rewriteDockerfilePhp("FROM php:7.4-apache\n")).toBe("FROM php:8.2-apache\n");
  });

  it("adds require.php when a repo has no Composer PHP constraint", () => {
    const after = rewriteComposerPhpPins(JSON.stringify({ name: "r3dlin3/phpoidc" }), {
      addRequireIfMissing: true,
    });
    expect(after).toContain('"php": ">=8.2 <8.4"');
  });
});
