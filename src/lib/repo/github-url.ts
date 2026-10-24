/**
 * Turn a pasted public GitHub link into an archive ZIP URL that `downloadPublicZip` accepts.
 * Accepts https://github.com/owner/repo, github.com/owner/repo, a trailing .git, and
 * /tree/<branch-or-tag>. Anything else is refused: no other hosts, no tokens, no API calls.
 */
export type GithubRepoRef = {
  owner: string;
  repo: string;
  ref: string | null;
  zipUrl: string;
  label: string;
  homepage: string;
};

const NAME = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/;
const REF = /^[A-Za-z0-9._/-]{1,200}$/;

export function parseGithubRepoUrl(input: string): GithubRepoRef | null {
  const raw = input.trim();
  if (!raw || raw.includes("..") || /\s/.test(raw)) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") return null;
  if (url.username || url.password) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!NAME.test(owner) || !NAME.test(repo) || repo === "." || repo === "..") return null;

  let ref: string | null = null;
  if (parts.length > 2) {
    if (parts[2] !== "tree" || parts.length < 4) return null;
    ref = decodeURIComponent(parts.slice(3).join("/"));
    if (!REF.test(ref) || ref.includes("..") || ref.startsWith("/") || ref.endsWith("/")) return null;
  }

  const archiveRef = ref ? ref.split("/").map(encodeURIComponent).join("/") : "HEAD";
  return {
    owner,
    repo,
    ref,
    zipUrl: `https://github.com/${owner}/${repo}/archive/${archiveRef}.zip`,
    label: ref ? `${owner}/${repo}@${ref}` : `${owner}/${repo}`,
    homepage: `https://github.com/${owner}/${repo}`,
  };
}
