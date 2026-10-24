"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

type SaplingCard = {
  claim: string;
  ok: boolean;
  error: string | null;
  status: string | null;
  rawLabel: string | null;
  probabilities: Record<string, number>;
  predictionSet: string[];
  timingMs: number | null;
};

type FightResult = {
  elapsedMs: number;
  scan: {
    id: string;
    exposure: { status: string; detectedVersion: string | null; reason: string };
    plan: {
      summary: string;
      actions: { type: string; files: string[]; description: string }[];
    } | null;
    planSource: string | null;
    planRequestId: string | null;
    readiness: { status: string; pinsMoved: string[] };
    patch: { hunks: { path: string }[] } | null;
  };
  naive: {
    live: boolean;
    requestId: string | null;
    latencyMs: number;
    error: string | null;
    plan: {
      label: string;
      subtitle: string;
      summary: string;
      actions: { type: string; files: string[]; description: string }[];
    };
    sapling: SaplingCard;
  };
  legal: {
    planSource: string | null;
    requestId: string | null;
    sapling: SaplingCard;
  };
};

const STAGES = [
  "Same repo, two routes in parallel…",
  "Plain luna: fix this CVE…",
  "Open Patch task: legal migration…",
  "Sapling scores both claims…",
];

export default function FightPage() {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(STAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FightResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setStage(STAGES[Math.min(i, STAGES.length - 1)]);
    }, 4000);
    try {
      const response = await fetch("/api/demo/fight", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Fight failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fight failed");
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0d1118] px-8 py-10">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <p className="relative text-xs uppercase tracking-[0.28em] text-ember">
          The 90-second knockout
        </p>
        <h1 className="relative mt-3 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Same model. Two routes.
          <span className="block text-mist-300">Plain luna vs Open Patch. Live.</span>
        </h1>
        <p className="relative mt-4 max-w-2xl text-base leading-7 text-mist-300">
          Left: gpt-6-luna as a normal engineer — advisory plus files, no policy task, not stored.
          Right: the same model on the frozen Open Patch task. Both request IDs are real. Sapling
          scores both claims. That is the comparison, not a mocked Claude.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={busy}
            className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-ink-950 disabled:opacity-60"
          >
            {busy ? stage : result ? "Run the A/B again" : "Route it both ways"}
          </button>
          {result ? (
            <Link
              href={`/scans/${result.scan.id}?demo=1`}
              className="rounded-full border border-ink-600 px-5 py-2.5 text-sm"
            >
              Continue to correction
            </Link>
          ) : null}
        </div>
        {error ? <p className="relative mt-4 text-sm text-signal-affected">{error}</p> : null}
      </section>

      {result ? (
        <>
          <p className="text-sm text-mist-300">
            Harbor Ledger is <span className="text-mist-100">{result.scan.exposure.status}</span> at{" "}
            <span className="font-mono text-mist-100">
              {result.scan.exposure.detectedVersion ?? "unknown"}
            </span>
            . {result.elapsedMs} ms wall clock. Pins moved:{" "}
            {result.scan.readiness.pinsMoved.join(", ") || "none"}.
          </p>

          <section className="grid gap-4 lg:grid-cols-2">
            <AgentColumn
              tone="illegal"
              title="Plain frontier"
              kicker={result.naive.requestId ?? "no request id"}
              summary={result.naive.plan.summary}
              actions={result.naive.plan.actions}
              badge={`live ${result.naive.latencyMs} ms · engineer prompt · not stored${result.naive.error ? ` · ${result.naive.error}` : ""}`}
              sapling={result.naive.sapling}
            />
            <AgentColumn
              tone="legal"
              title="Open Patch"
              kicker={result.legal.requestId ?? "no Mubit id"}
              summary={result.scan.plan?.summary ?? "No plan"}
              actions={result.scan.plan?.actions ?? []}
              badge={result.legal.planSource === "mubit" ? "live Mubit · frozen task · plan 3" : "fallback plan"}
              sapling={result.legal.sapling}
            />
          </section>

          <p className="text-xs leading-6 text-mist-500">
            Same gpt-6-luna, two Mubit tasks. Left is the prompt you would type into ChatGPT.
            Right is the frozen Open Patch task. Left is sent with x-middleware-store: false so it
            cannot train plan 3. Sapling <em>unsure</em> stays visible.
          </p>
        </>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Plain route", "Same model, engineer prompt, advisory + files. No policy. Not stored."],
            ["02", "Open Patch", "Frozen task. Team rules in the user message. Pins that exist."],
            ["03", "Referee", "Two live Sapling calls. Two request IDs. Scores on screen."],
          ].map(([n, t, d]) => (
            <article key={n} className="panel p-6">
              <p className="font-mono text-xs text-ember">{n}</p>
              <h2 className="mt-2 text-lg font-medium">{t}</h2>
              <p className="mt-2 text-sm leading-6 text-mist-300">{d}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function AgentColumn({
  tone,
  title,
  kicker,
  summary,
  actions,
  badge,
  sapling,
}: {
  tone: "illegal" | "legal";
  title: string;
  kicker: string;
  summary: string;
  actions: { type: string; files: string[]; description: string }[];
  badge: string;
  sapling: SaplingCard;
}) {
  const border = tone === "illegal" ? "border-rose-500/30" : "border-emerald-400/25";
  const glow = tone === "illegal" ? "text-rose-300" : "text-emerald-300";
  const entries = Object.entries(sapling.probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <article className={`panel p-6 ${border}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-mist-500">{kicker}</p>
      <h2 className={`mt-2 text-2xl font-semibold ${glow}`}>{title}</h2>
      <p className="mt-3 text-sm leading-6 text-mist-300">{summary}</p>
      <ul className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <li key={`${action.type}-${index}`} className="text-sm">
            <StatusBadge value={action.type} />
            <p className="mt-1 font-mono text-xs text-mist-500">{action.files.join(", ")}</p>
            <p className="mt-1 text-mist-300">{action.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-mist-500">{badge}</p>

      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/30 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-ember">Banyan Sapling</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {sapling.rawLabel ?? "no label"}
        </p>
        <p className="mt-1 text-sm text-mist-300">
          calibrated status: {sapling.status ?? "unavailable"}
          {sapling.timingMs != null ? ` · ${Math.round(sapling.timingMs)} ms` : ""}
        </p>
        <div className="mt-4 space-y-2">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-mist-400">
                <span>{key}</span>
                <span>{(value * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full ${tone === "illegal" ? "bg-rose-400" : "bg-emerald-400"}`}
                  style={{ width: `${Math.max(2, Math.round(value * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {sapling.predictionSet.length > 0 ? (
          <p className="mt-3 font-mono text-[11px] text-mist-500">
            set: {sapling.predictionSet.join(" · ")}
          </p>
        ) : null}
        {sapling.error ? <p className="mt-2 text-xs text-signal-affected">{sapling.error}</p> : null}
        <p className="mt-3 text-[11px] leading-5 text-mist-500">{sapling.claim}</p>
      </div>
    </article>
  );
}
