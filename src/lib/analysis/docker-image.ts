/** Read `FROM image:16`, `FROM image:16.20.2-alpine`, `FROM image:3.8-slim`. */
export function extractDockerImageTag(content: string, image: string): string | null {
  const match = content.match(new RegExp(`FROM\\s+${image}:(\\d+(?:\\.\\d+){0,2})`, "i"));
  return match?.[1] ?? null;
}

/** Keep the variant (alpine, slim, fpm) and move only the EOL tag. */
export function rewriteDockerImageTag(
  content: string,
  image: string,
  fromPrefix: string,
  toMinor: string,
): string {
  const escaped = fromPrefix.replace(/\./g, "\\.");
  return content.replace(
    new RegExp(`FROM(\\s+)${image}:${escaped}(?:\\.\\d+)?(-[^\\s]+)?`, "gi"),
    (_match, whitespace: string, variant?: string) =>
      `FROM${whitespace}${image}:${toMinor}${variant ?? ""}`,
  );
}
