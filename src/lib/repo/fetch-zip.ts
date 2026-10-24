import { ZIP_LIMITS } from "@/lib/config";
import { isAllowedArchiveUrl } from "@/lib/repo/catalog";

export async function downloadPublicZip(url: string): Promise<Buffer> {
  if (!isAllowedArchiveUrl(url)) {
    throw new Error("Only GitHub archive ZIP URLs are allowed.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "PatchPilot/0.1 (hackathon scanner; no scripts executed)" },
      redirect: "follow",
    });
    if (response.status === 404) {
      throw new Error(
        "GitHub returned 404. The repository is private, renamed, or that branch does not exist. Try a public repo or drop its ZIP.",
      );
    }
    if (!response.ok) {
      throw new Error(`GitHub archive returned HTTP ${response.status}`);
    }
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > ZIP_LIMITS.maxBytes) {
      throw new Error(`Archive is ${length} bytes; limit is ${ZIP_LIMITS.maxBytes}. Download a smaller tree or upload selected files.`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > ZIP_LIMITS.maxBytes) {
      throw new Error(`Archive exceeds the ${ZIP_LIMITS.maxBytes} byte read limit.`);
    }
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GitHub took longer than 45 s to send the archive. Try again or drop its ZIP.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
