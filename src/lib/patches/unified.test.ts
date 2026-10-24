import { describe, expect, it } from "vitest";
import { diffHunks, unifiedPatch } from "@/lib/patches/unified";

describe("unifiedPatch", () => {
  it("changes only the pinned line, with context", () => {
    const before = "FROM composer AS b\nRUN x\n\nFROM php:7.4-fpm-alpine\nRUN y\nCOPY . .\n";
    const after = before.replace("php:7.4", "php:8.2");
    const patch = unifiedPatch([{ path: "Dockerfile", before, after }]);
    expect(patch).toContain("diff --git a/Dockerfile b/Dockerfile");
    expect(patch).toContain("-FROM php:7.4-fpm-alpine\n+FROM php:8.2-fpm-alpine");
    expect(patch).toContain("@@ -1,6 +1,6 @@");
    expect(patch.match(/^-/gm)?.length).toBe(2); // the --- header and one removed line
  });

  it("marks a missing final newline", () => {
    const patch = unifiedPatch([{ path: ".php-version", before: "7.4.33", after: "8.2.35\n" }]);
    expect(patch).toContain("-7.4.33\n\\ No newline at end of file\n+8.2.35");
  });

  it("returns nothing when the file is unchanged", () => {
    expect(unifiedPatch([{ path: "a", before: "x\n", after: "x\n" }])).toBe("");
    expect(diffHunks("x\n", "x\n")).toEqual([]);
  });
});
