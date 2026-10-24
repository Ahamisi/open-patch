"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import type { Correction, PublicScan } from "@/lib/types";

const STEPS = ["Evidence", "Plan", "Patch", "Verify", "Learning"] as const;

export default function ScanPage() {
  return (
    <Suspense fallback={<p className="text-mist-300">Loading scan…</p>}>
      <ScanWorkspace />
    </Suspense>
  );
}

function ScanWorkspace() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const fromDemo = search.get("demo") === "1";
  const [scan, setScan] = useState<PublicScan | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [step, setStep] = useState<(typeof STEPS)[number]>("Evidence");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("incorrect");

  async function reload() {
    const response = await fetch(`/api/scans/${params.id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Failed to load scan");
    setScan(data.scan);
    setCorrections(data.corrections ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scans/${params.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setScan(data.scan);
        setCorrections(data.corrections ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function post(path: string, nextStep: (typeof STEPS)[number], body?: unknown) {
    setBusy(path);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed");
      if (data.scan) setScan(data.scan);
      else await reload();
      if (data.correction) setCorrections((current) => [data.correction, ...current]);
      setStep(nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  const saplingScores = useMemo(() => {
    const scores = scan?.verification?.saplingScores as
      | { probabilities?: Record<string, number>; prediction_set?: string[]; raw_label?: string }
      | null
      | undefined;
    return scores ?? null;
  }, [scan]);

  if (!scan) {
    return <p className="text-mist-300">{error ?? "Loading scan…"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">{scan.repoLabel}</p>
          <h1 className="mt-1 text-3xl font-semibold">{scan.name}</h1>
          <p className="mt-2 text-sm text-mist-300">{scan.advisory.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={scan.exposure.status} />
          <StatusBadge value={scan.advisoryEcosystem} />
          <StatusBadge value={scan.advisory.kind} />
          <StatusBadge value={scan.readiness.status} />
          {scan.planSource ? <StatusBadge value={scan.planSource === "mubit" ? "mubit" : "mock"} /> : null}
          {scan.policyVersion ? <StatusBadge value={scan.policyVersion} /> : null}
        </div>
      </div>

      <article className="panel px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-ember">Remediation status</p>
          <StatusBadge value={scan.readiness.status} />
        </div>
        <p className="mt-2 text-sm text-mist-300">{scan.readiness.reason}</p>
        {scan.readiness.pinsMoved.length > 0 ? (
          <p className="mt-2 font-mono text-xs text-mist-500">
            pins moved: {scan.readiness.pinsMoved.join(", ")}
          </p>
        ) : null}
        {scan.readiness.skipped.length > 0 ? (
          <p className="mt-1 font-mono text-xs text-mist-500">
            skipped: {scan.readiness.skipped.join(", ")}
          </p>
        ) : null}
        {scan.ecosystems.length > 0 ? (
          <p className="mt-1 font-mono text-xs text-mist-500">
            languages in archive: {scan.ecosystems.join(", ")}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-mist-500">
          Review-ready is not merged. A human still has to approve.
        </p>
      </article>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <button
            key={item}
            onClick={() => setStep(item)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              step === item ? "bg-ember text-ink-950" : "border border-ink-600 text-mist-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {fromDemo ? (
        <div className="panel px-5 py-4 text-sm text-mist-300">
          <p className="text-xs uppercase tracking-[0.18em] text-ember">Live demo is already run</p>
          <p className="mt-1">
            Walk Evidence → Plan → Patch → Verify → Learning. The Mubit request ID and the Sapling
            unsure verdict are real. Then mark the plan incorrect: runtime upgrade, not a PHP edit.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-signal-affected">{error}</p> : null}

      {step === "Evidence" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="panel p-6">
            <h2 className="text-lg font-medium">Exposure</h2>
            <p className="mt-3 text-sm leading-6 text-mist-300">{scan.exposure.reason}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-mist-500">Detected PHP</dt>
                <dd className="font-mono">{scan.exposure.detectedVersion ?? "not established"}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Affected range</dt>
                <dd className="font-mono">{scan.exposure.affectedRange ?? "n/a"}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Severity (advisory)</dt>
                <dd>{scan.advisory.severity}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Severity source</dt>
                <dd className="text-mist-300">{scan.advisory.severitySource}</dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 text-sm text-mist-300">
              {scan.exposure.limitations.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <button
              className="mt-6 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-60"
              disabled={busy !== null}
              onClick={() => post(`/api/scans/${scan.id}/plan`, "Plan")}
            >
              {busy ? "Calling Mubit…" : "Create remediation plan"}
            </button>
          </article>
          <article className="panel p-6">
            <h2 className="text-lg font-medium">Inspected files</h2>
            <p className="mt-2 text-xs text-mist-500">
              {scan.inspected.length} read · {scan.notInspected.length} skipped
            </p>
            <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-2">
              {scan.evidence.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink-600 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ember">{item.id}</span>
                    <span className="font-mono text-xs">{item.path}</span>
                    <StatusBadge value={item.confidence} />
                    <StatusBadge value={item.kind} />
                  </div>
                  <pre className="mt-2 overflow-auto text-[11px] leading-5 text-mist-300">
                    {item.excerpt}
                  </pre>
                </div>
              ))}
              {scan.notInspected.map((item) => (
                <p key={item} className="text-xs text-mist-500">
                  Not inspected: {item}
                </p>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {step === "Plan" ? (
        <section className="panel p-6">
          {!scan.plan ? (
            <p className="text-mist-300">No plan yet. Generate one from Evidence.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-medium">Remediation plan</h2>
                <StatusBadge value={scan.planSource === "mubit" ? "mubit" : "mock"} />
                {scan.planRequestId ? (
                  <span className="font-mono text-xs text-mist-500">{scan.planRequestId}</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-mist-300">{scan.plan.summary}</p>
              <div className="mt-5 space-y-3">
                {scan.plan.actions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-ink-600 p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={action.type} />
                      <StatusBadge value={action.priority} />
                    </div>
                    <p className="mt-2 text-sm text-mist-100">{action.description}</p>
                    <p className="mt-2 font-mono text-xs text-mist-500">
                      files: {action.files.join(", ") || "none"} · evidence: {action.evidenceIds.join(", ") || "none"}
                    </p>
                    <p className="mt-2 text-xs text-mist-500">Risk: {action.risk}</p>
                    <p className="text-xs text-mist-500">Rollback: {action.rollback}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-ember">
                Human approval required
              </p>
              <button
                className="mt-5 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink-950"
                disabled={busy !== null}
                onClick={() => post(`/api/scans/${scan.id}/patch`, "Patch")}
              >
                Generate proposed patch
              </button>
            </>
          )}
        </section>
      ) : null}

      {step === "Patch" ? (
        <section className="space-y-4">
          {!scan.patch ? (
            <p className="text-mist-300">No patch yet.</p>
          ) : (
            <>
              <article className="panel p-6">
                <h2 className="text-lg font-medium">{scan.patch.prTitle}</h2>
                <p className="mt-2 text-sm text-mist-300">{scan.patch.summary}</p>
                <pre className="mt-4 whitespace-pre-wrap text-xs text-mist-300">{scan.patch.prBody}</pre>
              </article>
              {scan.patch.hunks.map((hunk) => (
                <article key={hunk.path} className="panel overflow-hidden">
                  <div className="border-b border-ink-600 px-6 py-3">
                    <p className="font-mono text-sm">{hunk.path}</p>
                    <p className="text-xs text-mist-500">{hunk.reason}</p>
                  </div>
                  <pre className="overflow-auto p-4 font-mono text-[12px] leading-6">
                    {hunk.before.split("\n").map((line, index) => (
                      <div key={`d${index}`} className="diff-del">
                        -{line}
                      </div>
                    ))}
                    {hunk.after.split("\n").map((line, index) => (
                      <div key={`a${index}`} className="diff-add">
                        +{line}
                      </div>
                    ))}
                  </pre>
                </article>
              ))}
              <button
                className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink-950"
                disabled={busy !== null}
                onClick={() => post(`/api/scans/${scan.id}/checks`, "Patch")}
              >
                {busy ? "Running checks…" : "Run checks"}
              </button>
              <div className="panel p-6">
                <h3 className="text-sm font-medium">Check log</h3>
                {scan.checks.length === 0 ? (
                  <p className="mt-2 text-sm text-signal-unknown">Checks have not been run.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {scan.checks.map((check) => (
                      <li key={check.name} className="flex flex-wrap items-center gap-3 text-sm">
                        <StatusBadge value={check.status} />
                        <span className="font-mono text-xs">{check.command ?? check.name}</span>
                        <span className="text-mist-300">{check.details}</span>
                        <span className="text-mist-500">exit {check.exitCode ?? "n/a"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                className="rounded-full border border-ink-600 px-4 py-2 text-sm"
                disabled={busy !== null}
                onClick={() => post(`/api/scans/${scan.id}/verify`, "Verify")}
              >
                {busy ? "Calling Sapling…" : "Verify with Banyan Sapling"}
              </button>
            </>
          )}
        </section>
      ) : null}

      {step === "Verify" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="panel p-6">
            <h2 className="text-lg font-medium">Banyan Sapling</h2>
            {!scan.verification ? (
              <p className="mt-3 text-sm text-mist-300">Verification has not been requested.</p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge value={scan.verification.verificationStatus} />
                  <StatusBadge value={scan.verification.saplingVerdict} />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-mist-500">Claim</p>
                <p className="mt-1 text-sm text-mist-100">{scan.verification.claim}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-mist-500">Evidence sent to Sapling</p>
                <pre className="mt-1 max-h-32 overflow-auto text-xs text-mist-300">
                  {scan.verification.evidenceText ?? "See raw response."}
                </pre>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-mist-500">Raw Sapling response</p>
                <pre className="mt-1 max-h-48 overflow-auto text-xs text-mist-300">
                  {JSON.stringify(scan.verification.saplingRawResponse, null, 2)}
                </pre>
                {saplingScores?.probabilities ? (
                  <ul className="mt-4 space-y-1 text-xs font-mono text-mist-300">
                    {Object.entries(saplingScores.probabilities).map(([key, value]) => (
                      <li key={key}>
                        {key}: {value.toFixed(4)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 text-xs text-mist-500">
                  Uncertain results stay uncertain. A high raw score is not converted to pass.
                </p>
              </>
            )}
          </article>
          <article className="panel p-6">
            <h2 className="text-lg font-medium">Human correction</h2>
            <p className="mt-2 text-sm text-mist-300">
              Corrections are stored with the original output, policy version, evidence IDs, and
              Mubit run ID. They do not instantly train an adapter.
            </p>
            <select
              className="mt-4 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            >
              <option value="correct">correct</option>
              <option value="incorrect">incorrect</option>
              <option value="needs_more_evidence">needs_more_evidence</option>
            </select>
            <textarea
              className="mt-3 min-h-24 w-full rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="This is a runtime upgrade, not a PHP source rewrite."
            />
            <button
              className="mt-3 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink-950"
              disabled={busy !== null}
              onClick={() =>
                post(`/api/scans/${scan.id}/corrections`, "Learning", {
                  reviewerLabel: label,
                  note,
                  target: "plan",
                })
              }
            >
              Save correction
            </button>
            <div className="mt-5 space-y-3">
              {corrections.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink-600 p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={item.reviewerLabel} />
                    <span className="font-mono text-xs text-mist-500">{item.runId}</span>
                  </div>
                  <p className="mt-2 text-mist-300">{item.correctedOutput || "No note"}</p>
                  <p className="mt-1 text-xs text-mist-500">
                    policy {item.policyVersion}
                    {item.mubitRequestId ? ` · follow-up ${item.mubitRequestId}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {step === "Learning" ? (
        <section className="panel p-6">
          <h2 className="text-lg font-medium">Mubit task trail</h2>
          <p className="mt-2 text-sm text-mist-300">
            Recurring task <span className="font-mono text-ember">advisory_to_migration_plan</span>.
            Adapter status is not inferred. Open the Mubit console for kept-example counts.
          </p>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-mist-500">
                <tr>
                  <th className="py-2">When</th>
                  <th>Purpose</th>
                  <th>Request ID</th>
                  <th>Recorded</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {scan.mubitCalls.map((call) => (
                  <tr key={call.id} className="border-t border-ink-600">
                    <td className="py-2 text-mist-500">{call.createdAt}</td>
                    <td>{call.purpose}</td>
                    <td className="font-mono">{call.requestId ?? "—"}</td>
                    <td>{call.mock ? "mock" : call.recordedForTraining ? "yes" : "held-out / not stored"}</td>
                    <td>{call.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
