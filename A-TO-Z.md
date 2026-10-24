# Open Patch A–Z

Working build list for Night Shift. Do these letters in order. Do not skip to polish while K, R, and X are open.

**One sentence:** decide which migration is legal, verify the claim, teach the task. Do not build another coding agent.

**Why this exists:** Claude will rewrite `Invoice.php` and call the CVE fixed. Open Patch first decides which kind of fix is legal. A source edit cannot patch an interpreter. PHP 7.4 / php2shell is this month’s fire, not the product. Snyk finds CVEs. OpenHands and Aider edit trees. We do not claim their runtimes or a live integration we have not wired.

---

## Hard rules (do not break)

1. **Never edit `PLAN_SYSTEM_PROMPT` in `src/lib/llm/mubit.ts`.** Mubit groups calls by model + system instructions + tools + output format. One wording change starts a new task and training restarts from zero. The workspace already split into `plan` / `plan 2` / `plan 3` because we edited it. It is frozen.
2. All variation (repo, advisory, evidence, reviewer notes, policy version, session id) stays in the **user message**.
3. Every application LLM call goes through Mubit. No direct provider calls.
4. Never fake a Sapling verdict, check pass, adapter, GitHub PR, or security finding.
5. Never execute untrusted repo scripts, Composer hooks, or CI.
6. Harbor Ledger is a **synthetic** 7.4 fixture. Say so. Real public ZIPs are labeled real.
7. Do not claim an adapter passed unless [app.mubit.ai](https://app.mubit.ai) Tasks / Adapters shows it. Today it does not.
8. We do not patch php2shell. We remove the **upgrade blocker** (the pin). Supported PHP gets interpreter fixes as they ship.

**Live console task:** `PatchPilot's advisory-to-migration-plan 3` (plan 2 is the older 4-kept split)  
**Console:** https://app.mubit.ai  
**Local task name:** `advisory_to_migration_plan`  
**Policy in user message:** `SEC-RUNTIME-01@2026-10-24`

---

## Status

| Letter | Name | Status |
| --- | --- | --- |
| A | Thesis | Done |
| B | Intake | Done |
| C | Inventory | Done |
| D | Exposure | Done |
| E | Frozen Mubit task | Done — do not reopen the prompt |
| F | Patch | Done |
| G | Checks | Done |
| H | Verify (Sapling) | Done |
| I | Human correction | Done |
| J | Team notes in next user message | Done |
| K | Volume toward 25 kept examples | Sent 2026-10-24 — 32 live same-task calls. Console kept-count is authoritative |
| L | Held-out eval | Done |
| M | Honest Learning / console | Done |
| N | Language packs | Done (PHP / Node / Python) |
| O | Real fixtures, labeled | Done |
| P | Request IDs + session | Done |
| Q | Demo runbook `/demo` | Done |
| R | One-click Harbor Ledger after Next restart | Done 2026-10-24 — 29s, then re-plan is `mubit` |
| S | Newbie ZIP path | Done 2026-10-24 — raw ZIP no longer inherits Harbor Ledger |
| T | Scoreboard | Done |
| U | Fast refresh (policy flip, user message only) | Done 2026-10-24 — 8.2 vs 8.3 in user message |
| V | Adapter claim gate | **Open (keep honest)** |
| W | Judge-question cards | Done |
| X | Rehearse live path | Done 2026-10-24 — walked Evidence → Learning |
| Y | Tests green | Done (26 passing) |
| Z | Freeze and walk on | **Last** |

---

## A — Thesis

PatchPilot is a security-migration engineer for **any unsupported runtime**. The recurring Mubit task is `advisory → exposure → legal plan`. The product is the task, not PHP.

- Home hero and `/demo` already say this.
- Do not rebrand mid-hackathon.

## B — Intake

User picks a catalog repo or uploads a ZIP, plus a seeded advisory (or pasted text treated as untrusted).

- `src/app/page.tsx`, `src/app/api/scans/route.ts`, `src/lib/repo/zip.ts`
- ZIP limits in `src/lib/config.ts`. Path traversal and symlinks rejected.
- Catalog `repoId` must survive multipart upload (do not overwrite to `"upload"`).

## C — Inventory

Parse Dockerfile, composer / package / pyproject, version files, CI. Show inspected vs not inspected.

- `src/lib/repo/inventory.ts`, `src/lib/analysis/*`
- Missing production OS / SAPI stay missing.

## D — Exposure

Deterministic compare of pins vs advisory range. Output `affected` | `not_affected` | `unknown` with evidence IDs and limitations.

- `src/lib/analysis/exposure.ts`
- If the runtime cannot be established, return `unknown`, not a confident miss.

## E — Frozen Mubit task

One system prompt, one model (`gpt-6-luna`), `response_format: json_object`.

- File: `src/lib/llm/mubit.ts` — `PLAN_SYSTEM_PROMPT` is **FROZEN**.
- Client: `callMubitTaskRaw`. Held-out sets `x-middleware-store: false`.
- There is no `systemPrompt` override anymore. Do not add one back.
- Tests in `src/lib/llm/plan.test.ts` assert the prompt still starts with the same sentence.

## F — Patch

Propose a small diff for pins that **already exist**. Do not invent missing Docker / CI / version files. Do not leak Harbor Ledger names into other repos.

- `src/lib/patches/generate.ts` — PHP / Node / Python dispatch.

## G — Checks

Allowlisted static checks only. Missing pin files are `not_run`, not fail. `review_ready` means applicable checks passed.

- `src/lib/checks/run.ts`, `src/lib/checks/readiness.ts`

## H — Verify

Server-side Banyan Sapling: claim + policy + evidence. Show `status`, `raw_label`, probabilities. Keep `unsure`.

- `src/lib/sapling/client.ts`, `src/app/api/scans/[id]/verify/route.ts`
- If Sapling is down, label unavailable. Never fabricate.

## I — Human correction

Reviewer marks `correct` | `incorrect` | `needs_more_evidence` and writes a note. Persist original output, note, policy version, evidence IDs, request ID.

- `src/app/api/scans/[id]/corrections/route.ts`
- A correction does **not** instantly train an adapter.

## J — Team notes (the Mubit win)

When the label is `incorrect`, send another call of the **same** task. The note is `teamNotes` in the user message. Later plans also receive stored notes.

- `src/lib/llm/plan.ts` — `buildPlanUserMessage`, `teamNotesFromCorrections`
- Do not put notes in the system prompt.

## K — Volume  **← sent; refresh the console**

Mubit typically needs ~25 **kept** examples before first training. Console count is authoritative. Local recorded-call counts are not.

**Done 2026-10-24**

- Prompt stayed frozen. No `plan 4` was created from this side.
- Sent **32 / 32** live same-task examples via `POST /api/mubit/examples` (offset batches of 4).
- First request IDs: `mreq_01a16c671c047f82ac9c64f364557364` … last `mreq_01a16c6aa0ed7892bfa6adece656c471`.
- 2026-10-24 morning: sent **24 compact live-shaped** examples (`shaped: true`) so plan 3 traffic looks like real plans, not one-liners. Refresh Tasks → **plan 3**. Kept count is still console-only.

If a **plan 4** appears, stop. The prompt changed. Revert `PLAN_SYSTEM_PROMPT`.

Do not fire more volume from a script that changes instructions, model, or `response_format`.

## L — Held-out eval

`POST /api/eval` scores schema, evidence IDs, required-action recall, unsupported claims. Those calls are not stored for training.

- `src/lib/evaluation/heldout.ts`

## M — Honest Learning page

`/learning` must say:

- local recorded calls ≠ console kept examples
- live task name is `PatchPilot's advisory-to-migration-plan 2`
- adapter status is not authoritative unless the console says so

## N — Language packs

Shipping: PHP, Node, Python (same exposure / patch / check contract).  
Inventory-only: Java, Go.

Adding a new shipping language is **user-message and deterministic parsers only**. Never a new system prompt.

## O — Fixtures

- Harbor Ledger = synthetic, labeled.
- Cached public archives under `fixtures/archives/`.
- Catalog in `src/lib/repo/catalog.ts`.

## P — Traceability

Every Mubit answer should carry `x-middleware-request-id`. Each scan puts `sessionId: scan.id` in the user message so retries stay one story. Provider `metadata` was rejected (400); do not send it again.

## Q — Demo runbook

`/demo` — five acts, 2–3 minutes, plus judge cards.

1. Hook: php2shell, not a chatbot.
2. Evidence: Harbor Ledger affected → plan → request ID.
3. Patch + checks: pins that exist, `review_ready`.
4. Verify: Sapling may be unsure.
5. Correct: note in next user message → console task 2.

## R — One-click demo  **← blocked on X**

Home button **Run the live Harbor Ledger demo** (`POST /api/demo/run`) must finish: scan → plan → patch → checks → Sapling.

If Next is compiling `/api/scans` forever, this letter is red. Restart, then time it (expect 20–40s).

## S — Newbie ZIP path

A first-time owner downloads a public ZIP, uploads it, picks an advisory, gets exposure + plan without a GitHub token.

**Done 2026-10-24**

- Uploading a ZIP sets `repoId=upload`. Harbor Ledger is ignored.
- Label comes from the ZIP filename if the form still says Harbor Ledger (`src/lib/repo/intake.ts`).
- Verified: `php-calculator.zip` → label `php calculator`, exposure `affected` 7.4.
- Verified: `node-docker-defaults.zip` → label `node docker defaults`, exposure `not_affected` Node 18.
- Home shows a banner: “Using your ZIP… catalog row ignored.”

## T — Scoreboard

Intelligence shows frontier plans vs notes examples vs held-out. These are **local** counts. Do not present them as adapter quality.

## U — Fast refresh

Policy lives in the user message (`policyVersion`). A team rule change must not edit the system prompt.

**Done 2026-10-24**

- `SEC-RUNTIME-01` = accepted pin is 8.2.
- `SEC-RUNTIME-01-REFRESH` = accepted pin is 8.3. Last week's 8.2 plan is now the bug.
- Home has a house-policy select. Same Mubit task. Only `policyVersion` changes.
- Do not send a volume batch after flipping policy in a way that edits the system prompt. The prompt is still frozen.

## V — Adapter claim gate  **← keep closed**

UI copy and README already refuse to say “trained.” If the console later shows a passing adapter:

- screenshot Tasks / Adapters
- compare in Try models
- score the adapter output locally if we add a record path
- still do not invent latency or $ figures

Until then, letter V is “leave the gate shut.”

## W — Judge questions

On `/demo`:

- Why not Claude? Wrong *kind* of fix.
- Why Mubit? Correction is a kept example of one task; console is authority.
- Do we patch php2shell? No. We move the pin.

## X — Rehearse  **← do with R**

Walk Q on a live server. Hunt regressions on home, scan, learning, demo.

**Build-through**

1. User stops the hung `npm run dev` (agent cannot always kill :3000).
2. `npm run dev` again.
3. Walk `/demo` acts 1–5 with Harbor Ledger.
4. Confirm request IDs appear in the console under **plan 2**, not a new task.
5. Fix only what broke. Do not “improve” the prompt.

## Y — Tests

```bash
npm test
npm run typecheck
```

Keep green. Add tests when changing exposure, patcher, or the frozen-prompt contract. Do not add tests that need live Mubit.

## Z — Freeze and walk on

When R and X are green:

- No more prompt edits. No more features that risk a new task.
- `/demo` is the script.
- Intelligence + console is the Mubit proof.
- Harbor Ledger is labeled synthetic.
- Sapling unsure is allowed.
- Stop.

---

## What we are not building

- Autonomous merge or deploy
- A generic chatbot
- Calling an adapter by model ID (Mubit has none)
- FixOnce’s unit-oracle / PHP deprecation rewriter (different product, same story: upgrade blocker)
- New system prompts for PHP vs Node vs Python

---

## Suggested next hour

1. **X / R** — restart Next, walk the Harbor Ledger demo.
2. **K** — send same-task examples; watch plan 2 only.
3. **S** — one real ZIP upload.
4. **U** — policy flip in the user message if time.
5. **Z** — stop.

When a letter finishes, tick the Status table above. If a change would edit `PLAN_SYSTEM_PROMPT`, it is not a letter — it is a regression.
