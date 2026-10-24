import Link from "next/link";

const ACTS = [
  {
    n: "01",
    title: "Hook — php2shell, not a chatbot",
    body: "Patches exist only on PHP 8.2+. Harbor Ledger is still on 7.4. A source edit cannot fix the interpreter. That is why this is a recurring task, not a one-off Claude chat.",
  },
  {
    n: "02",
    title: "Evidence — Harbor Ledger is affected",
    body: "Dockerfile php:7.4-apache, Composer <8.0, CI 7.4. Missing production OS stays unknown. Click Analyze, then Create remediation plan. A real Mubit request ID appears.",
  },
  {
    n: "03",
    title: "Patch + checks — pins that exist",
    body: "Generate the 8.2 pin patch. Run checks. Missing files are skipped, not failed. review_ready means the pins that existed moved. A human still has to approve.",
  },
  {
    n: "04",
    title: "Verify — Sapling can be unsure",
    body: "Send the claim, policy, and evidence. Leave unsure visible. Do not say the CVE is fixed.",
  },
  {
    n: "05",
    title: "Correct — same task, new example",
    body: "Mark the plan incorrect: “runtime upgrade, not a source rewrite.” The note goes into the next user message. Open Intelligence, then app.mubit.ai → Requests. Newest volume is PatchPilot's advisory-to-migration-plan 3. Do not claim an adapter passed.",
  },
];

const QUESTIONS = [
  {
    q: "Why not Snyk?",
    a: "Snyk finds the advisory. Open Patch classifies the *kind* of remediation against repo pins and team policy. Finding ≠ legal plan.",
  },
  {
    q: "Why not OpenHands or Aider?",
    a: "They are editors. We do not reinvent that runtime. We decide the migration, constrain it, verify the claim, then a human approves. Source rewrites are a later handoff — not claimed tonight.",
  },
  {
    q: "Why not just ask Claude?",
    a: "Claude will rewrite Invoice.php and call the CVE fixed. Open Patch first decides which kind of fix is legal. The wrong kind is the bug.",
  },
  {
    q: "Why Mubit?",
    a: "Same prompt, same JSON. A correction is a kept example of that task. Console is authority. We do not claim an adapter until Tasks says so.",
  },
  {
    q: "Does this patch php2shell?",
    a: "No. It removes the upgrade blocker. Supported PHP gets interpreter fixes as they ship.",
  },
  {
    q: "What if the house rule changes to 8.3?",
    a: "Flip the policy on Scans. Only policyVersion in the user message changes. Last week's 8.2 pin is now the bug. Same Mubit task — not plan 4.",
  },
];

export default function DemoPage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0d1118] px-8 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-ember">2–3 minutes · five acts</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
          The demo we will walk.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-mist-300">
          Harbor Ledger is a synthetic 7.4 fixture. Mubit, Sapling, and check exit codes are live.
          A first-time owner can also upload any ZIP on Scans — no GitHub token. Scripts never run.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/fight"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink-950"
          >
            Film the fight
          </Link>
          <Link
            href="/"
            className="rounded-full border border-ink-600 px-5 py-2.5 text-sm"
          >
            Start from Scans
          </Link>
          <a
            href="https://app.mubit.ai"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-ink-600 px-5 py-2.5 text-sm"
          >
            Open Mubit console
          </a>
        </div>
      </section>

      <section className="grid gap-4">
        {ACTS.map((act) => (
          <article key={act.n} className="panel p-6">
            <p className="font-mono text-xs text-ember">{act.n}</p>
            <h2 className="mt-2 text-lg font-medium">{act.title}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-300">{act.body}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">If a judge asks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((item) => (
            <article key={item.q} className="panel p-6">
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-mist-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
