import { extractDockerfilePhp } from "@/lib/analysis/php-version";
import { extractDockerImageTag } from "@/lib/analysis/docker-image";
import { findFile } from "@/lib/repo/inventory";
import type { Advisory, Ecosystem, RepoFile } from "@/lib/store";

const LANGUAGE_FILES: { ecosystem: Ecosystem; names: string[]; ext?: string }[] = [
  { ecosystem: "php", names: ["composer.json", "composer.lock", ".php-version"], ext: ".php" },
  { ecosystem: "node", names: ["package.json", "package-lock.json", ".nvmrc", ".node-version"] },
  { ecosystem: "python", names: ["pyproject.toml", "requirements.txt", "runtime.txt", ".python-version"] },
  { ecosystem: "java", names: ["pom.xml", "build.gradle", "build.gradle.kts"] },
  { ecosystem: "go", names: ["go.mod", "go.sum"] },
  { ecosystem: "ruby", names: ["Gemfile", "Gemfile.lock", ".ruby-version"] },
];

export function advisoryEcosystem(advisory: Advisory): Ecosystem {
  if (advisory.ecosystem) return advisory.ecosystem;
  const hay = `${advisory.id} ${advisory.component} ${advisory.title}`.toLowerCase();
  if (hay.includes("php") || hay.includes("imagick") || hay.includes("cgi")) return "php";
  if (/\bnode\b/.test(hay) || hay.includes("npm") || hay.includes("nodejs")) return "node";
  if (hay.includes("python") || hay.includes("django") || hay.includes("flask")) return "python";
  if (hay.includes("java") || hay.includes("log4j") || hay.includes("maven")) return "java";
  if (/\bgo\b/.test(hay) || hay.includes("golang")) return "go";
  if (hay.includes("ruby") || hay.includes("rails")) return "ruby";
  return "unknown";
}

export function detectEcosystems(files: RepoFile[]): Ecosystem[] {
  const found = new Set<Ecosystem>();
  for (const file of files) {
    const base = file.path.split("/").pop() ?? file.path;
    for (const pack of LANGUAGE_FILES) {
      if (pack.names.includes(base) || (pack.ext && file.path.endsWith(pack.ext))) {
        found.add(pack.ecosystem);
      }
    }
    if (extractDockerfilePhp(file.content)) found.add("php");
    if (extractDockerImageTag(file.content, "node")) found.add("node");
    if (extractDockerImageTag(file.content, "python")) found.add("python");
    if (extractDockerImageTag(file.content, "openjdk") || extractDockerImageTag(file.content, "eclipse-temurin")) {
      found.add("java");
    }
    if (extractDockerImageTag(file.content, "golang")) found.add("go");
    if (extractDockerImageTag(file.content, "ruby")) found.add("ruby");
  }
  return [...found];
}

export function hasEcosystemSignals(files: RepoFile[], ecosystem: Ecosystem): boolean {
  return detectEcosystems(files).includes(ecosystem);
}

export function primaryManifest(files: RepoFile[], ecosystem: Ecosystem): RepoFile | undefined {
  const names: Record<Ecosystem, string[]> = {
    php: ["composer.json"],
    node: ["package.json"],
    python: ["pyproject.toml", "requirements.txt", "runtime.txt"],
    java: ["pom.xml", "build.gradle"],
    go: ["go.mod"],
    ruby: ["Gemfile"],
    unknown: [],
  };
  for (const name of names[ecosystem] ?? []) {
    const hit = findFile(files, name);
    if (hit) return hit;
  }
  return undefined;
}
