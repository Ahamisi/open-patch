import { describe, expect, it } from "vitest";
import { labelUploadedRepo, stemFromZipName } from "@/lib/repo/intake";

describe("labelUploadedRepo", () => {
  it("uses the ZIP filename instead of the Harbor Ledger default", () => {
    expect(labelUploadedRepo("Harbor Ledger — weekend scan", "phpOIDC-master.zip")).toBe(
      "phpOIDC master",
    );
  });

  it("keeps an explicit owner name", () => {
    expect(labelUploadedRepo("Billing API weekend", "whatever.zip")).toBe("Billing API weekend");
  });

  it("does not call an unlabeled upload Harbor Ledger", () => {
    expect(labelUploadedRepo("PHP scan")).toBe("Uploaded ZIP");
    expect(labelUploadedRepo("Harbor Ledger — weekend scan")).toBe("Uploaded ZIP");
  });
});

describe("stemFromZipName", () => {
  it("strips the extension", () => {
    expect(stemFromZipName("node-docker-defaults.zip")).toBe("node docker defaults");
  });
});
