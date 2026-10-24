"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

type Advisory = { id: string; title: string };
type Policy = { id: string; title: string; note: string };
type RepoChoice = { id: string; name: string; origin: "synthetic_fixture" | "public_github" };
type RecentScan = { id: string; name: string; exposure: { status: string }; createdAt: string };

/** Links we ran end to end before the demo. Labels say what you will see. */
const EXAMPLES = [
  { url: "https://github.com/sspangsberg/PHP-Calculator", label: "PHP-Calculator", hint: "PHP 7.4 · Docker + Composer" },
  { url: "https://github.com/ucan-lab/docker-laravel-alpine", label: "docker-laravel-alpine", hint: "PHP 7.4 · Laravel" },
  { url: "https://github.com/r3dlin3/phpOIDC", label: "phpOIDC", hint: "PHP 7.4 · OpenID server" },
  { url: "https://github.com/symfony/demo", label: "symfony/demo", hint: "Already on 8.4" },
  { url: "https://github.com/laravel/laravel/tree/v8.6.12", label: "laravel v8.6.12", hint: "Version is ambiguous" },
];

const STAGES = [
  { at: 0, text: "Downloading the repository" },
  { at: 2, text: "Reading Dockerfile, composer.json, CI and .php-version" },
  { at: 4, text: "Asking Mubit for a migration plan" },
  { at: 18, text: "Writing the patch and running checks" },
  { at: 24, text: "Verifying the result with Sapling" },
];

function repoNameFromUrl(value: string): string | null {
  const match = value.match(/github\.com\/([^/\s]+\/[^/\s#?]+)/i);
  return match ? match[1].replace(/\.git$/i, "") : null;
}

export default function HomePage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [zip, setZip] = useState<File | null>(null);
  const [offlineRepo, setOfflineRepo] = useState("");
  const [advisoryId, setAdvisoryId] = useState("php-74-eol");
  const [advisoryText, setAdvisoryText] = useState("");
  const [policyId, setPolicyId] = useState("sec-runtime-01");
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [repos, setRepos] = useState<RepoChoice[]>([]);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/scans")
      .then((response) => response.json())
      .then((data) => {
        setAdvisories(data.advisories ?? []);
        setPolicies(data.policies ?? []);
        setRepos(data.repos ?? []);
        setRecent(data.scans ?? []);
      })
      .catch(() => undefined);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function check(urlOverride?: string) {
    const url = (urlOverride ?? githubUrl).trim();
    const useZip = !urlOverride && zip;
    const useOffline = !urlOverride && !zip && !url && offlineRepo;
    if (!url && !useZip && !useOffline) {
      setError("Paste a public GitHub repository link first.");
      return;
    }
    setBusy(true);
    setError(null);
    setElapsed(0);
    const started = Date.now();
    timer.current = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);

    const form = new FormData();
    const custom = advisoryText.trim().length > 0;
    form.set("advisoryId", custom ? "custom" : advisoryId);
    form.set("advisoryText", advisoryText);
    form.set("policyId", policyId);
    form.set("convert", "1");
    if (useZip && zip) {
      form.set("repoId", "upload");
      form.set("zip", zip);
      form.set("name", `${zip.name.replace(/\.zip$/i, "")} scan`);
    } else if (useOffline) {
      form.set("repoId", offlineRepo);
      form.set("name", `${repos.find((repo) => repo.id === offlineRepo)?.name ?? "Sample"} scan`);
    } else {
      form.set("repoId", "github-url");
      form.set("githubUrl", url);
      form.set("name", `${repoNameFromUrl(url) ?? "GitHub repo"} scan`);
    }

    try {
      const response = await fetch("/api/scans", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The check failed.");
      router.push(`/scans/${data.scan.id}?converted=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check failed.");
      setBusy(false);
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  const stage = [...STAGES].reverse().find((item) => elapsed >= item.at) ?? STAGES[0];
  const offlineChoices = repos.filter((repo) => repo.origin === "public_github" || repo.id === "legacy-billing-php");

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0d1118] px-6 py-10 md:px-12 md:py-14">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="relative max-w-3xl">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Is your PHP runtime the vulnerability?
          </h1>
          <p className="mt-4 text-base leading-7 text-mist-300">
            Paste a repository. Open Patch finds the PHP version it actually runs, moves the version
            pins to a supported release, and hands you a patch to review. Your application code
            stays as it is.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void check();
            }}
          >
            <input
              aria-label="GitHub repository link"
              className="min-w-0 flex-1 rounded-full border border-ink-600 bg-ink-950 px-5 py-3 font-mono text-sm outline-none focus:border-ember/60"
              placeholder="https://github.com/your-team/your-repo"
              value={githubUrl}
              disabled={busy}
              onChange={(event) => {
                setGithubUrl(event.target.value);
                if (event.target.value.trim()) setZip(null);
              }}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-ink-950 disabled:opacity-60"
            >
              {busy ? "Checking…" : "Check my repo"}
            </button>
          </form>

          {busy ? (
            <p className="mt-4 text-sm text-mist-300" aria-live="polite">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-ember" />
              {stage.text}… <span className="font-mono text-mist-500">{elapsed}s</span>
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-signal-affected" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-4 text-xs leading-5 text-mist-500">
              Public GitHub repositories, no sign-in. We only read files; nothing in the repository
              runs. Each check makes one live call to our Mubit task and takes 15–40 seconds.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="self-center text-xs text-mist-500">Try:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.url}
                type="button"
                disabled={busy}
                onClick={() => {
                  setGithubUrl(example.url);
                  void check(example.url);
                }}
                className="rounded-full border border-ink-600 px-3 py-1.5 text-left text-xs hover:border-ember/50 disabled:opacity-50"
              >
                <span className="text-mist-100">{example.label}</span>
                <span className="ml-2 text-mist-500">{example.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            k: "1",
            t: "Find the real version",
            d: "We read the pins that decide which PHP runs: Dockerfile, composer.json, CI and .php-version. If they don't say, we tell you we don't know.",
          },
          {
            k: "2",
            t: "Plan the upgrade with Mubit",
            d: "Mubit plans the move under your team's policy (PHP 8.2 by default). A code edit can't fix a vulnerable interpreter, so the plan doesn't pretend it can.",
          },
          {
            k: "3",
            t: "Review and merge",
            d: "You get a patch that changes only those pin files, checked and independently verified. Download it, open a branch, merge when you're happy.",
          },
        ].map((item) => (
          <article key={item.k} className="panel p-6">
            <p className="font-mono text-xs text-ember">{item.k}</p>
            <h2 className="mt-2 text-lg font-medium">{item.t}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-300">{item.d}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <details className="panel p-6">
          <summary className="cursor-pointer text-sm font-medium">More options</summary>
          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="text-mist-300">Advisory</span>
              <select
                className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
                value={advisoryId}
                onChange={(event) => setAdvisoryId(event.target.value)}
              >
                {(advisories.length ? advisories : [{ id: "php-74-eol", title: "PHP 7.4 end-of-life" }]).map(
                  (advisory) => (
                    <option key={advisory.id} value={advisory.id}>
                      {advisory.title}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-mist-300">Team policy</span>
              <select
                className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
                value={policyId}
                onChange={(event) => setPolicyId(event.target.value)}
              >
                {(policies.length
                  ? policies
                  : [{ id: "sec-runtime-01", title: "Supported line 8.2", note: "" }]
                ).map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-mist-300">Or upload a ZIP of a private repository</span>
              <input
                type="file"
                accept=".zip"
                disabled={busy}
                className="mt-1 block w-full text-sm text-mist-300"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setZip(file);
                  if (file) setGithubUrl("");
                }}
              />
            </label>
            <label className="block text-sm">
              <span className="text-mist-300">Or use a sample without network</span>
              <select
                className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
                value={offlineRepo}
                onChange={(event) => setOfflineRepo(event.target.value)}
              >
                <option value="">None</option>
                {offlineChoices.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-mist-300">Or paste your own advisory text</span>
              <textarea
                className="mt-1 min-h-20 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
                value={advisoryText}
                onChange={(event) => setAdvisoryText(event.target.value)}
              />
            </label>
            {zip || (offlineRepo && !githubUrl.trim()) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void check()}
                className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-60"
              >
                {busy ? "Checking…" : zip ? `Check ${zip.name}` : "Check this sample"}
              </button>
            ) : null}
          </div>
        </details>

        <div className="panel p-6">
          <h2 className="text-sm font-medium">Recent checks</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-mist-500">None yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 5).map((scan) => (
                <li key={scan.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-600 px-3 py-2 text-left text-sm hover:border-ember/40"
                    onClick={() => router.push(`/scans/${scan.id}`)}
                  >
                    <span className="truncate">{scan.name.replace(/ scan$/, "")}</span>
                    <StatusBadge value={scan.exposure.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
