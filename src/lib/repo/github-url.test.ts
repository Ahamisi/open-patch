import { describe, expect, it } from "vitest";
import { isAllowedArchiveUrl } from "@/lib/repo/catalog";
import { parseGithubRepoUrl } from "@/lib/repo/github-url";

describe("parseGithubRepoUrl", () => {
  it("maps a plain repo link to the default-branch archive", () => {
    const ref = parseGithubRepoUrl("https://github.com/sspangsberg/PHP-Calculator");
    expect(ref?.zipUrl).toBe("https://github.com/sspangsberg/PHP-Calculator/archive/HEAD.zip");
    expect(ref?.label).toBe("sspangsberg/PHP-Calculator");
    expect(isAllowedArchiveUrl(ref!.zipUrl)).toBe(true);
  });

  it("accepts no scheme, trailing slash and .git", () => {
    expect(parseGithubRepoUrl("github.com/laravel/laravel/")?.zipUrl).toBe(
      "https://github.com/laravel/laravel/archive/HEAD.zip",
    );
    expect(parseGithubRepoUrl("https://github.com/slimphp/Slim-Skeleton.git")?.repo).toBe(
      "Slim-Skeleton",
    );
  });

  it("keeps a branch or tag from /tree/", () => {
    const ref = parseGithubRepoUrl("https://github.com/laravel/laravel/tree/8.x");
    expect(ref?.zipUrl).toBe("https://github.com/laravel/laravel/archive/8.x.zip");
    expect(ref?.label).toBe("laravel/laravel@8.x");
    expect(isAllowedArchiveUrl(ref!.zipUrl)).toBe(true);
  });

  it("refuses other hosts, credentials, deep links and traversal", () => {
    expect(parseGithubRepoUrl("https://gitlab.com/a/b")).toBeNull();
    expect(parseGithubRepoUrl("https://github.com.evil.io/a/b")).toBeNull();
    expect(parseGithubRepoUrl("https://user:tok@github.com/a/b")).toBeNull();
    expect(parseGithubRepoUrl("https://github.com/a/b/blob/main/index.php")).toBeNull();
    expect(parseGithubRepoUrl("https://github.com/a/b/tree/../../x")).toBeNull();
    expect(parseGithubRepoUrl("https://github.com/onlyowner")).toBeNull();
    expect(parseGithubRepoUrl("")).toBeNull();
  });
});
