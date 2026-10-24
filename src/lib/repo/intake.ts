export const HARBOR_DEFAULT_NAME = /harbor ledger|^php scan$|weekend scan/i;

export function stemFromZipName(fileName: string | undefined): string | null {
  if (!fileName) return null;
  const stem = fileName
    .replace(/\.zip$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return stem || null;
}

/** Never let an uploaded archive inherit the Harbor Ledger fixture name. */
export function labelUploadedRepo(scanName: string, zipFileName?: string): string {
  if (scanName.trim() && !HARBOR_DEFAULT_NAME.test(scanName)) return scanName.trim();
  const fromZip = stemFromZipName(zipFileName);
  if (fromZip && !HARBOR_DEFAULT_NAME.test(fromZip)) return fromZip;
  return "Uploaded ZIP";
}
