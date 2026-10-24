# Open Patch

**Who runs this:** a platform or security engineer who owns many legacy PHP (and later Node/Python) repos.

**Recurring job:** when a runtime advisory lands — this week [php2shell](https://www.php.net/) / PHP 7.4 EOL — decide which pin move is legal, once, instead of pasting each tree into Claude and leaving `FROM php:7.4-apache` in place. That class of work is a two-hour frontier session per repo. Uber burned a year of AI coding budget in four months doing it.

Policy-aware runtime migrations with independently verified evidence and a [Mubit](https://docs.mubit.ai/) learning loop. Built for [Night Shift](https://luma.com/nightshift-london).

This is **not** another Snyk / OpenHands / Aider. Those find CVEs or edit trees. Open Patch decides which *kind* of migration is legal, checks the claim with [Banyan Sapling](https://huggingface.co/MubitLabs/banyan-sapling), and keeps reviewer corrections on one frozen Mubit task. PHP 7.4 is this month’s fire, not the product.

The Mubit system prompt still starts with `You are PatchPilot's advisory-to-migration-plan task.` That string is frozen so training does not restart. Do not rename it.

## What the repo shows (after this push)

| Path | What Max can confirm |
| --- | --- |
| `src/lib/llm/mubit.ts` | All app LLM calls go through `https://api.mubit.ai/openai/v1`. `metadata.session_id` is sent. Held-out / baseline / repair use `x-middleware-store: false`. |
| `src/lib/config.ts` | Committed default `MUBIT_BASE_URL`. Key stays in `.env`. |
| `src/app/fight` + `src/app/api/demo/fight` | Same-model A/B: ChatGPT-shaped paste (`store:false`) vs frozen plan 3. Two live `mreq_` IDs. Dual Sapling. |
| `src/lib/checks/run.ts` + `src/lib/checks/readiness.ts` | Missing pins are `not_run` (skipped). A failed applicable check keeps the scan `incomplete`. |
| `src/lib/sapling/client.ts` | `unsure` / insufficient / inconsistent stay `uncertain`. Never converted to pass. |
| `/api/mubit/status` | Honest snapshot. Adapter is **not** live. Silent test is not Passed. |

## What it does

1. Inventories a bundled PHP fixture (or an uploaded ZIP) without executing repository scripts.
2. Compares runtime/dependency evidence to a seeded advisory and returns `affected`, `not_affected`, or `unknown`.
3. Asks Mubit for a structured remediation plan (`advisory_to_migration_plan`).
4. Proposes a small config/runtime diff for the pins that actually exist, runs allowlisted static checks, and marks the scan `review_ready` only when those checks pass.
5. Sends a specific claim, policy, and evidence to Banyan Sapling and keeps the raw verdict, including `unsure`.
6. Records human corrections. It does **not** claim that a correction instantly trained a model.

## Failed, skipped, and unsure (do not invent pass)

| Signal | What the code does |
| --- | --- |
| Pin file missing (no Dockerfile, no CI, no `.php-version`) | Check status `not_run`. Listed on the scan as skipped. **Not a fail.** |
| Pin exists and still on the old line after the proposed patch | Check status `fail`. Readiness stays `incomplete`. Not `review_ready`. |
| Exposure `unknown` | Readiness `investigation`. Collect the missing runtime/OS fact first. |
| Exposure `not_affected` | Readiness `no_change`. No invented source edit. |
| Affected but no rewriteable pin | Readiness `no_change`. We will not invent an `Invoice.php` edit. |
| Sapling `unsure`, `insufficient_information`, or `inconsistent_context` | Verification status `uncertain`. Left on screen. Not treated as supported. |
| Sapling unavailable | Verification `unavailable`. Deterministic checks are the only automated signal. |

`review_ready` means: the pins that existed moved, the checks that apply passed, and a **human still has to approve**. Open Patch does not merge.

## Fight A/B (`/fight`)

Same CVE, same `gpt-6-luna`, two routes:

- **Left:** ChatGPT-shaped paste of app source only. Different system prompt. `store:false` so it cannot train plan 3.
- **Right:** Frozen task + the four pins + house rule PHP 8.2.

Each side gets its own `mreq_` id and a Sapling score. That is the before/after the demo can show **today**. It is not a trained adapter beating luna. See Adapter status below.

## Setup

```bash
git clone https://github.com/Ahamisi/open-patch.git
cd open-patch
cp .env.example .env
# put your Mubit key in .env — server-side only
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/fight` is the A/B. `/` then Harbor Ledger is the ZIP-or-fixture path.

### Environment

Defaults are committed in `src/lib/config.ts` and `.env.example`. Only the key is secret.

| Variable | Purpose |
| --- | --- |
| `MUBIT_API_KEY` | Workspace key (`mbt_…`). Never sent to the browser. |
| `MUBIT_BASE_URL` | Default `https://api.mubit.ai/openai/v1` (committed) |
| `MUBIT_MODEL` | Default `gpt-6-luna` |
| `BANYAN_SAPLING_URL` | Live HF endpoint used by the server |
| `BANYAN_SAPLING_TOKEN` | Optional; the current endpoint accepts unauthenticated POST |

If `MUBIT_API_KEY` is missing, the UI stays up and labels mock plan output as mock. It will not pretend those results came from Mubit.

## Tests and build

```bash
npm test
npm run typecheck
npm run build
```

## Repositories you can test

Harbor Ledger is a **synthetic fixture we wrote**. It is not a real company. Use it when you need a reliable PHP 7.4 pin.

For real public code, the app can fetch GitHub archives at scan time, or you can download the ZIP yourself and upload it:

- [laravel/laravel 12.x](https://github.com/laravel/laravel/archive/refs/heads/12.x.zip)
- [laravel/laravel v8.6.12](https://github.com/laravel/laravel/archive/refs/tags/v8.6.12.zip)
- [slimphp/Slim-Skeleton](https://github.com/slimphp/Slim-Skeleton/archive/refs/heads/master.zip)
- [symfony/demo](https://github.com/symfony/demo/archive/refs/heads/main.zip)

Exposure is computed from whatever is actually in the archive. A modern Laravel skeleton with `require.php: ^8.2` and no Docker pin is inferred as `not_affected` for the 7.4 EOL advisory, with that limitation stated. An older `^7.3|^8.0` constraint without a pin is `unknown`.

## Demo (2–3 minutes)

1. **Fight** (`/fight`) — same CVE, two plans, two `mreq_` IDs, dual Sapling. Left guessed 8.4 / violation. Right named 8.2 pins / supported. Unsure stays visible.
2. Continue into Harbor Ledger Evidence. Four pins: Dockerfile `php:7.4-apache`, Composer `<8.0`, CI `7.4`, `.php-version` `7.4.33`.
3. Plan — frozen task, live request ID.
4. Patch — only those pins, house 8.2. Missing files skipped. Failed applicable checks block `review_ready`.
5. Verify — Sapling often `unsure`. Leave it. Do not say php2shell is patched (PHP.net patched the engine on supported lines).
6. Intelligence + Mubit console — plan 3, 660 calls, 44 kept, v1 Silent test 33.3%. Not Passed. Still luna.

## Adapter status (24 Oct 2026, 22:45 London — console is authority)

Task: `PatchPilot's advisory-to-migration-plan 3` (`ln_7b8e75ee6161e8c0ec917e8d`).

| Fact | Value |
| --- | --- |
| Adapter | v1, **Silent test 10%** — advisory exam, not production |
| Exam | v1: 33.3% vs 95% target on 12 held-out cases (base model + prompt: 8.3%) |
| Calls / kept | 660 / 44 (v1 trained on the first 36; most new calls not reviewed yet: daily review limit) |
| Answered by adapter | 0.0% |
| Served by | `gpt-6-luna` |

Silent test is **not** Passed. Open Patch still calls luna. A correction is stored as an example; it does not flip the served model. We will not claim a live trained version until the console says Passed and traffic is on that version. If that happens before the film, re-run Fight and show the same Sapling task answering better. Until then the A/B is same-model, two routes. Why 95% is not reachable tonight: [`submit/ADAPTER-CEILING-NOTE.md`](submit/ADAPTER-CEILING-NOTE.md).

## Mubit task design

- Stable system prompt: `You are PatchPilot's advisory-to-migration-plan task.`
- Same model and `response_format: json_object` on every call.
- Variable content stays in the user message.
- Synthetic examples use that same task.
- Held-out evaluation, Fight baseline, and plan-repair retries send `x-middleware-store: false`.
- Training uses kept examples, not request count. The console count is authoritative.

## Banyan Sapling contract (live, inspected)

```http
POST $BANYAN_SAPLING_URL
Content-Type: application/json

{ "inputs": { "policy": "...", "evidence": "...", "claim": "..." } }
```

Response fields preserved as returned: `status`, `raw_label`, `probabilities`, `prediction_set`, `conformal_prediction_set`, `logits`, `status_provenance`, `usage`, `timing_ms`.

## Known limitations

- PHP first. Language packs exist for Node/Python pins. No GitHub import or pull request.
- Checks are allowlisted static parsers. Composer scripts, container builds, and repository CI are never executed.
- Production OS/SAPI is not observed; Windows CGI stays `unknown`.
- Sapling classifies supplied text. It is not a scanner or exploit proof.
- No adapter is live. The UI says `Check Mubit console` and shows the dated snapshot above.

## Safety

- ZIP path traversal, symlinks, size, depth, and file-count limits are enforced.
- Repository README and comments cannot override system instructions.
- No automatic merge or deploy.
- Secrets stay in environment variables.
