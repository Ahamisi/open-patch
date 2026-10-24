"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

type Status = {
  configured: boolean;
  taskName: string;
  consoleTaskHint?: string;
  consoleUrl?: string;
  adapterStatus: { label: string; authoritative: boolean; explanation: string };
  localCounts: Record<string, number>;
  recentRequestIds: string[];
  calls: {
    id: string;
    requestId: string | null;
    purpose: string;
    mock: boolean;
    recordedForTraining: boolean;
    latencyMs: number;
    createdAt: string;
    error: string | null;
  }[];
};

type EvalRun = {
  id: string;
  createdAt: string;
  note: string;
  results: {
    caseId: string;
    schemaValid: boolean;
    evidenceIdsValid: boolean;
    requiredActionRecall: number;
    unsupportedClaim: boolean;
    latencyMs: number;
    mubitRequestId: string | null;
    error: string | null;
  }[];
};

const TARGET = 25;

export default function LearningPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [statusRes, evalRes] = await Promise.all([
      fetch("/api/mubit/status"),
      fetch("/api/eval"),
    ]);
    setStatus(await statusRes.json());
    const evalJson = await evalRes.json();
    setRuns(evalJson.runs ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function sendExamples() {
    setBusy("examples");
    setError(null);
    try {
      const response = await fetch("/api/mubit/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 12 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Example send failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Example send failed");
    } finally {
      setBusy(null);
    }
  }

  async function runEval() {
    setBusy("eval");
    setError(null);
    try {
      const response = await fetch("/api/eval", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Eval failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval failed");
    } finally {
      setBusy(null);
    }
  }

  const recorded = status?.localCounts.recordedCalls ?? 0;
  const progress = Math.min(100, Math.round((recorded / TARGET) * 100));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0d1118] px-8 py-10">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <p className="relative text-xs uppercase tracking-[0.22em] text-ember">
          Open Patch · intelligence layer
        </p>
        <h1 className="relative mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
          A correction is not a chat memory.
          <span className="block text-mist-300">It is another example of the same Mubit task.</span>
        </h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-6 text-mist-300">
          Security teams reject the same bad plan every week: “edit the source.” The right action
          is a runtime pin — PHP this month, Node or Python the next. The reviewer note goes into
          the next user message. The system prompt stays frozen so Mubit keeps one task. We do not
          claim the adapter passed unless you can see that in Mubit.
        </p>
      </section>

      {error ? <p className="text-sm text-signal-affected">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Call", "Plan request through Mubit"],
          ["Correct", "Reviewer marks incorrect"],
          ["Record", "Same task, new example"],
          ["Adapt", "Console trains at ~25 kept"],
        ].map(([title, body], index) => (
          <article key={title} className="panel p-5">
            <p className="font-mono text-xs text-ember">0{index + 1}</p>
            <h2 className="mt-2 font-medium">{title}</h2>
            <p className="mt-1 text-sm text-mist-300">{body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-mist-500">Local progress</p>
              <h2 className="mt-1 text-lg font-medium">
                {recorded} local recorded calls · console target {TARGET}
              </h2>
            </div>
            <StatusBadge value={status?.adapterStatus.label ?? "unknown"} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full bg-ember" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-mist-300">{status?.adapterStatus.explanation}</p>
          <p className="mt-2 font-mono text-xs text-mist-500">
            local task: {status?.taskName}
          </p>
          <p className="mt-1 font-mono text-xs text-ember">
            console task: {status?.consoleTaskHint ?? "PatchPilot's advisory-to-migration-plan 3"}
          </p>
          <a
            className="mt-3 inline-block text-sm text-ember underline"
            href={status?.consoleUrl ?? "https://app.mubit.ai"}
            target="_blank"
            rel="noreferrer"
          >
            Open Mubit console
          </a>
        </article>
        <article className="panel p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-mist-500">The lesson we teach</p>
          <div className="mt-3 rounded-xl border border-signal-affected/30 p-3 text-sm text-mist-300">
            <p className="text-xs uppercase tracking-[0.14em] text-signal-affected">Rejected</p>
            Edit src/Invoice.php and call the CVE fixed.
          </div>
          <div className="mt-3 rounded-xl border border-signal-clear/30 p-3 text-sm text-mist-300">
            <p className="text-xs uppercase tracking-[0.14em] text-signal-clear">Corrected</p>
            Runtime upgrade: Dockerfile, composer.json, .php-version, CI. Source stays.
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Frontier plans", status?.localCounts.frontierPlans ?? 0, "First plan call on a scan"],
          ["Notes examples", status?.localCounts.notesExamples ?? 0, "Same task after a reviewer note"],
          ["Held-out", status?.localCounts.heldOutCalls ?? 0, "x-middleware-store: false"],
        ].map(([title, count, body]) => (
          <article key={String(title)} className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mist-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold">{count}</p>
            <p className="mt-1 text-sm text-mist-300">{body}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-60"
          disabled={busy !== null}
          onClick={sendExamples}
        >
          {busy === "examples" ? "Sending examples through Mubit…" : "Send 12 more task examples"}
        </button>
        <button
          className="rounded-full border border-ink-600 px-5 py-2.5 text-sm disabled:opacity-60"
          disabled={busy !== null}
          onClick={runEval}
        >
          {busy === "eval" ? "Evaluating held-out set…" : "Run held-out evaluation"}
        </button>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-medium">Mubit request IDs to open in the console</h2>
        <p className="mt-2 text-sm text-mist-500">
          Requests → newest first. Task name is taken from the first words of the system prompt.
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-ember">
          {(status?.recentRequestIds ?? []).map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </section>

      <section className="panel overflow-auto p-6">
        <h2 className="text-lg font-medium">Call log</h2>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-mist-500">
            <tr>
              <th className="py-2">Purpose</th>
              <th>Request</th>
              <th>Recorded</th>
              <th>ms</th>
            </tr>
          </thead>
          <tbody>
            {(status?.calls ?? []).map((call) => (
              <tr key={call.id} className="border-t border-ink-600">
                <td className="py-2">{call.purpose}</td>
                <td className="font-mono">{call.requestId ?? "—"}</td>
                <td>{call.mock ? "mock" : call.recordedForTraining ? "yes" : "not stored"}</td>
                <td>{call.latencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-medium">Held-out evaluation</h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-sm text-mist-300">
            Not run yet. Held-out calls use x-middleware-store: false so they never become training
            examples.
          </p>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="mt-4">
              <p className="text-xs text-mist-500">{run.createdAt}</p>
              <p className="mt-1 text-sm text-mist-300">{run.note}</p>
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-mist-500">
                  <tr>
                    <th className="py-2">Case</th>
                    <th>Schema</th>
                    <th>Evidence IDs</th>
                    <th>Recall</th>
                    <th>Unsupported</th>
                  </tr>
                </thead>
                <tbody>
                  {run.results.map((item) => (
                    <tr key={item.caseId} className="border-t border-ink-600">
                      <td className="py-2 font-mono">{item.caseId}</td>
                      <td>{item.schemaValid ? "yes" : "no"}</td>
                      <td>{item.evidenceIdsValid ? "yes" : "no"}</td>
                      <td>{item.requiredActionRecall.toFixed(2)}</td>
                      <td>{item.unsupportedClaim ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
