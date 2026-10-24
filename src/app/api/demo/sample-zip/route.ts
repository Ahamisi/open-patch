import { readFileSync } from "node:fs";
import path from "node:path";

/** Public PHP 7.4 repo a team can drop in — same archive as the catalog row. */
export async function GET() {
  const file = path.join(process.cwd(), "fixtures", "archives", "php-calculator.zip");
  const body = readFileSync(file);
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="PHP-Calculator-7.4.zip"',
      "Cache-Control": "no-store",
    },
  });
}
