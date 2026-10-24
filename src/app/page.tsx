"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

type Advisory = {
  id: string;
  title: string;
  kind: string;
  severity: string;
  summary: string;
};

type RecentScan = {
  id: string;
  name: string;
  exposure: { status: string };
  planSource: string | null;
  createdAt: string;
};

type RepoChoice = {
  id: string;
  name: string;
  origin: "synthetic_fixture" | "public_github";
  language?: string;
  description: string;
  homepage?: string;
  zipUrl?: string;
  downloadHint?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [repos, setRepos] = useState<RepoChoice[]>([]);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [name, setName] = useState("Harbor Ledger — weekend scan");
  const [repoId, setRepoId] = useState("legacy-billing-php");
  const [advisoryId, setAdvisoryId] = useState("php-74-eol");
  const [advisoryText, setAdvisoryText] = useState("");
  const [policies, setPolicies] = useState<{ id: string; title: string; note: string }[]>([]);
  const [policyId, setPolicyId] = useState("sec-runtime-01");
  const [zip, setZip] = useState<File | null>(null);
  const [busy, setBusy] = useState<"scan" | "demo" | "convert" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoNote, setDemoNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scans")
      .then((response) => response.json())
      .then((data) => {
        setAdvisories(data.advisories ?? []);
        setRepos(data.repos ?? []);
        setPolicies(data.policies ?? []);
        setRecent(data.scans ?? []);
      })
      .catch(() => setAdvisories([]));
  }, []);

  async function runDemo() {
    setBusy("demo");
    setError(null);
    setDemoNote("Inspecting Harbor Ledger…");
    const stages = [
      "Routing the plan through Mubit…",
      "Generating the 8.2 runtime patch…",
      "Running allowlisted checks…",
      "Verifying the claim with Banyan Sapling…",
    ];
    let i = 0;
    const timer = setInterval(() => {
      setDemoNote(stages[Math.min(i, stages.length - 1)]);
      i += 1;
    }, 3500);
    try {
      const response = await fetch("/api/demo/run", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Demo failed");
      router.push(`/scans/${data.scan.id}?demo=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed");
    } finally {
      clearInterval(timer);
      setBusy(null);
    }
  }

  async function analyze(event: { preventDefault: () => void }, convert = false) {
    event.preventDefault();
    setBusy(convert ? "convert" : "scan");
    setError(null);
    setDemoNote(
      convert
        ? "Reading the ZIP, planning on the frozen task, moving pins…"
        : null,
    );
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("repoId", zip ? "upload" : repoId);
      form.set("advisoryId", zip && advisoryText ? "custom" : advisoryId);
      form.set("advisoryText", advisoryText);
      form.set("policyId", policyId);
      if (convert) form.set("convert", "1");
      if (zip) form.set("zip", zip);
      const response = await fetch("/api/scans", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Scan failed");
      router.push(convert ? `/scans/${data.scan.id}?converted=1` : `/scans/${data.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setBusy(null);
    }
  }

  async function usePublicTeamZip() {
    setError(null);
    try {
      const response = await fetch("/api/demo/sample-zip");
      if (!response.ok) throw new Error("Could not fetch the sample team ZIP");
      const blob = await response.blob();
      const file = new File([blob], "PHP-Calculator-7.4.zip", { type: "application/zip" });
      setZip(file);
      setName("PHP-Calculator team upload");
      setRepoId("upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sample ZIP failed");
    }
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0d1118] px-8 py-10 md:px-12 md:py-14">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <p className="relative text-xs uppercase tracking-[0.28em] text-ember">
          Open Patch · policy-aware migrations · verified by Sapling · learned on Mubit
        </p>
        <h1 className="relative mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Not another tool that patches code.
          <span className="block text-mist-300">The system that decides which migration is legal.</span>
        </h1>
        <p className="relative mt-5 max-w-2xl text-base leading-7 text-mist-300">
          For a platform or security engineer who owns many legacy PHP repos: when a runtime
          advisory lands, run this instead of a two-hour Claude paste per tree. Snyk finds the
          CVE. OpenHands and Aider edit the tree. Open Patch decides which pin move is legal,
          whether the claim holds, and whether last week&apos;s correction still applies. PHP
          7.4 / php2shell is this week&apos;s fire. The task is any unsupported runtime.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#drop-repo"
            className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-ink-950"
          >
            Drop a team ZIP — we convert the pins
          </a>
          <a
            href="/fight"
            className="rounded-full border border-ink-600 px-6 py-3 text-sm"
          >
            Same CVE, two plans
          </a>
          <button
            onClick={runDemo}
            disabled={busy !== null}
            className="rounded-full border border-ink-600 px-6 py-3 text-sm disabled:opacity-60"
          >
            {busy === "demo" ? demoNote ?? "Running live demo…" : "Harbor fixture only"}
          </button>
        </div>
        {error ? <p className="relative mt-4 text-sm text-signal-affected">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            k: "01",
            t: "Decide, don't invent",
            d: "Affected / not_affected / unknown from pins that exist. A source edit cannot remediate an interpreter. We do not pretend to be Snyk's scanner or OpenHands' editor.",
          },
          {
            k: "02",
            t: "Team rules in the user message",
            d: "House policy (8.2 vs 8.3) and reviewer notes travel with each plan. The Mubit system prompt stays frozen so the task does not split.",
          },
          {
            k: "03",
            t: "Verify, then learn",
            d: "Banyan Sapling scores a specific claim against evidence. Unsure stays unsure. A correction is another example of the same task — not a chat memory.",
          },
        ].map((item) => (
          <article key={item.k} className="panel p-6">
            <p className="font-mono text-xs text-ember">{item.k}</p>
            <h2 className="mt-2 text-lg font-medium">{item.t}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-300">{item.d}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Snyk",
            d: "Finds CVEs and open-source risk. It does not decide that a PHP 7.4 pin is a runtime finding, and it does not keep a team correction as a recurring Mubit task.",
          },
          {
            t: "OpenHands / Aider",
            d: "They edit the repo. We would hand them a source-compat pass later. Tonight we only move pins that exist. We do not claim their runtime or a live integration we have not wired.",
          },
          {
            t: "Claude in a chat",
            d: "It will rewrite calculator.php and call the CVE fixed. Open Patch refuses that class of plan, then asks Sapling and a human.",
          },
        ].map((item) => (
          <article key={item.t} className="panel p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-mist-500">Not this</p>
            <h2 className="mt-2 text-lg font-medium">{item.t}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-300">{item.d}</p>
          </article>
        ))}
      </section>

      <section className="panel grid gap-3 px-6 py-5 md:grid-cols-5">
        {[
          { lang: "PHP", state: "shipping", note: "7.4 EOL — this month's fire" },
          { lang: "Node", state: "shipping", note: "16 EOL — same engine" },
          { lang: "Python", state: "shipping", note: "3.8 EOL — same engine" },
          { lang: "Java", state: "same contract", note: "inventory + advisory next" },
          { lang: "Go", state: "same contract", note: "inventory + advisory next" },
        ].map((pack) => (
          <div key={pack.lang}>
            <p className="text-sm font-medium">{pack.lang}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember">{pack.state}</p>
            <p className="mt-1 text-xs text-mist-500">{pack.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          id="drop-repo"
          className="panel space-y-5 p-8"
          onSubmit={(event) => analyze(event, true)}
        >
          <p className="text-xs uppercase tracking-[0.22em] text-mist-500">Team upload</p>
          <h2 className="text-2xl font-semibold">Drop their ZIP. We convert the pins.</h2>
          <p className="text-sm text-mist-300">
            A platform team hands you the archive. We inventory locks, plan on the frozen Mubit
            task, move only files that exist under your house rule, and score the claim. We do
            not rewrite their app source. Scripts never run.
          </p>
          <label className="block text-sm">
            <span className="text-mist-300">Scan name</span>
            <input
              className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-mist-300">Repository</span>
            <select
              className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
              value={repoId}
              onChange={(event) => {
                setRepoId(event.target.value);
                const selected = repos.find((item) => item.id === event.target.value);
                if (selected) setName(`${selected.name} scan`);
              }}
            >
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {(repo.language ?? "repo").toUpperCase()} ·{" "}
                  {repo.origin === "synthetic_fixture" ? "Fixture · " : "GitHub · "}
                  {repo.name}
                </option>
              ))}
            </select>
          </label>
          {repos.find((item) => item.id === repoId) ? (
            <p className="text-xs leading-5 text-mist-500">
              {repos.find((item) => item.id === repoId)?.description}
              {repos.find((item) => item.id === repoId)?.homepage ? (
                <>
                  {" "}
                  <a
                    className="text-ember underline"
                    href={repos.find((item) => item.id === repoId)?.homepage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open on GitHub
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="text-mist-300">Seeded advisory</span>
            <select
              className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
              value={advisoryId}
              onChange={(event) => setAdvisoryId(event.target.value)}
            >
              {advisories.map((advisory) => (
                <option key={advisory.id} value={advisory.id}>
                  {advisory.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-mist-300">House policy — user message only</span>
            <select
              className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
              value={policyId}
              onChange={(event) => setPolicyId(event.target.value)}
            >
              {(policies.length > 0 ? policies : [
                { id: "sec-runtime-01", title: "SEC-RUNTIME-01 — supported line 8.2", note: "" },
                {
                  id: "sec-runtime-01-refresh",
                  title: "SEC-RUNTIME-01 refresh — supported line 8.3",
                  note: "",
                },
              ]).map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.title}
                </option>
              ))}
            </select>
          </label>
          {policyId === "sec-runtime-01-refresh" ? (
            <p className="text-xs leading-5 text-mist-500">
              Fast refresh: last week&apos;s 8.2 pin is now the bug. Same Mubit task. Only
              policyVersion in the user message changes.
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="text-mist-300">Team ZIP — any repo they already have</span>
            <div className="mt-1 rounded-2xl border border-dashed border-ember/40 bg-ink-950 px-4 py-5">
              <input
                type="file"
                accept=".zip"
                className="block w-full text-sm text-mist-300"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setZip(file);
                  if (file) {
                    const stem = file.name.replace(/\.zip$/i, "");
                    setName(`${stem} scan`);
                  }
                }}
              />
              <button
                type="button"
                onClick={usePublicTeamZip}
                className="mt-3 text-xs text-ember underline"
              >
                No ZIP handy? Use a public PHP 7.4 team repo (PHP-Calculator)
              </button>
            </div>
          </label>
          {zip ? (
            <p className="rounded-xl border border-ember/30 px-3 py-2 text-xs leading-5 text-mist-300">
              Ready to convert <span className="font-mono text-ember">{zip.name}</span>. Catalog
              row ignored. No GitHub token. App source is not rewritten.
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="text-mist-300">Or paste advisory text — treated as untrusted</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2"
              value={advisoryText}
              onChange={(event) => setAdvisoryText(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-60"
            >
              {busy === "convert"
                ? demoNote ?? "Converting pins…"
                : zip
                  ? "Convert this ZIP"
                  : "Convert selected repo"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={(event) => analyze(event, false)}
              className="rounded-full border border-ink-600 px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {busy === "scan" ? "Inspecting…" : "Inspect only"}
            </button>
          </div>
          <p className="text-xs leading-5 text-mist-500">
            Convert = plan + pin patch + checks + Sapling. Inspect only = inventory. Scripts,
            Composer hooks, and CI never run. A human still merges.
          </p>
        </form>

        <aside className="space-y-4">
          <div className="panel p-6">
            <h2 className="text-sm font-medium">What is Harbor Ledger?</h2>
            <p className="mt-2 text-sm leading-6 text-mist-300">
              A tiny invoice app we authored for this hackathon. It is not a real product or
              customer repo. We pinned it to PHP 7.4 on purpose so the runtime-upgrade demo is
              deterministic. Everything else — Mubit plans, Sapling verdicts, check exit codes —
              is live.
            </p>
          </div>
          <div className="panel p-6">
            <h2 className="text-sm font-medium">Real public ZIPs you can download</h2>
            <ul className="mt-3 space-y-2 text-sm text-mist-300">
              {repos
                .filter((repo) => repo.zipUrl)
                .map((repo) => (
                  <li key={repo.id}>
                    <a className="text-ember underline" href={repo.zipUrl} target="_blank" rel="noreferrer">
                      {repo.name}
                    </a>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-mist-500">
              Download, then upload the ZIP here. We only read manifests, pins, and CI. No package
              scripts or builds run.
            </p>
          </div>
          <div className="panel p-6">
            <h2 className="text-sm font-medium">Three honest statuses</h2>
            <ul className="mt-3 space-y-3 text-sm text-mist-300">
              <li>
                <StatusBadge value="affected" /> PHP 7.4 / Node 16 / Python 3.8 — pin is inside the range
              </li>
              <li>
                <StatusBadge value="not_affected" /> Constraint or image is already outside the range
              </li>
              <li>
                <StatusBadge value="unknown" /> Runtime or OS was never established
              </li>
            </ul>
          </div>
          <div className="panel p-6">
            <h2 className="text-sm font-medium">Recent scans</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-mist-500">None yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recent.slice(0, 5).map((scan) => (
                  <li key={scan.id}>
                    <button
                      className="flex w-full items-center justify-between rounded-xl border border-ink-600 px-3 py-2 text-left text-sm hover:border-ember/40"
                      onClick={() => router.push(`/scans/${scan.id}`)}
                    >
                      <span>{scan.name}</span>
                      <StatusBadge value={scan.exposure.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
