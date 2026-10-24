import { unifiedPatch } from "@/lib/patches/unified";
import { getScan } from "@/lib/store";

/** The proposed pin changes as a `git apply`-able patch file. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  if (!scan.patch || scan.patch.hunks.length === 0) {
    return Response.json({ error: "This scan has no changes to download." }, { status: 404 });
  }
  const slug =
    scan.repoLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "repo";
  const header = [
    `From: Open Patch <noreply@open-patch.local>`,
    `Subject: [PATCH] ${scan.patch.prTitle}`,
    "",
    scan.patch.prBody,
    "---",
    "",
  ].join("\n");
  return new Response(header + unifiedPatch(scan.patch.hunks), {
    headers: {
      "Content-Type": "text/x-diff; charset=utf-8",
      "Content-Disposition": `attachment; filename="open-patch-${slug}.patch"`,
      "Cache-Control": "no-store",
    },
  });
}
