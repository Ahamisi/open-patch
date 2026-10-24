const TONE: Record<string, string> = {
  affected: "border-signal-affected/40 bg-signal-affected/10 text-signal-affected",
  not_affected: "border-signal-clear/40 bg-signal-clear/10 text-signal-clear",
  unknown: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  confirmed: "border-signal-confirmed/40 bg-signal-confirmed/10 text-signal-confirmed",
  inferred: "border-signal-inferred/40 bg-signal-inferred/10 text-signal-inferred",
  missing: "border-signal-missing/40 bg-signal-missing/10 text-signal-missing",
  pass: "border-signal-clear/40 bg-signal-clear/10 text-signal-clear",
  fail: "border-signal-affected/40 bg-signal-affected/10 text-signal-affected",
  not_run: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  error: "border-signal-affected/40 bg-signal-affected/10 text-signal-affected",
  verified: "border-signal-clear/40 bg-signal-clear/10 text-signal-clear",
  contradicted: "border-signal-affected/40 bg-signal-affected/10 text-signal-affected",
  uncertain: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  unavailable: "border-signal-missing/40 bg-signal-missing/10 text-signal-missing",
  mubit: "border-ember/40 bg-ember/10 text-ember",
  mock: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  supported: "border-signal-clear/40 bg-signal-clear/10 text-signal-clear",
  violation: "border-signal-affected/40 bg-signal-affected/10 text-signal-affected",
  insufficient_information: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  inconsistent_context: "border-signal-inferred/40 bg-signal-inferred/10 text-signal-inferred",
  unsure: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  review_ready: "border-signal-clear/40 bg-signal-clear/10 text-signal-clear",
  incomplete: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
  no_change: "border-ink-600 text-mist-300",
  investigation: "border-signal-unknown/40 bg-signal-unknown/10 text-signal-unknown",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const key = (value ?? "unknown").toLowerCase();
  return <span className={`chip ${TONE[key] ?? "border-ink-600 text-mist-300"}`}>{value ?? "unknown"}</span>;
}
