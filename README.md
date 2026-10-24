# Open Patch

**php2shell is a bug in the PHP engine, not in your app.** Rewriting `Invoice.php` doesn't fix it; moving the runtime to a patched PHP does. Open Patch takes a repository, finds the PHP version it actually runs, plans the upgrade under your team's policy with [Mubit](https://docs.mubit.ai/), and hands you a patch that changes only the version pins. A person reviews and merges.

Built for Mubit [Night Shift](https://luma.com/nightshift-london), London, 24–25 Oct 2026.

## Try it

1. Paste a public GitHub link on the home page, for example `https://github.com/sspangsberg/PHP-Calculator`, and click **Check my repo**.
2. In 15–40 s you get the verdict: **"PHP 7.4 → 8.2. 2 files to change."**, the Mubit request ID for the plan, and Banyan Sapling's verdict shown as returned (`unsure` stays `unsure`).
3. **Download patch** gives a `git apply`-ready file. **Copy branch commands** gives `git checkout -b open-patch/php-8.2 && git apply … && git commit && git push`, plus the GitHub compare link to open the PR.

For PHP-Calculator the whole patch is three lines:

```diff
--- a/dockerfile
-FROM php:7.4-fpm-alpine
+FROM php:8.2-fpm-alpine
--- a/composer.json
-            "php": "7.4.0"
+            "php": "8.2.35"
-        "php": ">=7.4.0",
+        "php": ">=8.2 <8.4",
```

It applies cleanly to the real repo. No `app/*.php` file is touched. If a repo doesn't pin its version, the answer is **unknown** and the plan says what's missing; it doesn't guess.

## What the demo video shows (2:00)

1. **The problem.** php2shell (CVE-2026-109618 / 109619, 21 Oct 2026) is unauthenticated RCE in PHP itself, fixed only on 8.2.35, 8.3.36, 8.4.27 and 8.5.12. A chatbot "fixes" it by rewriting app code and leaves `FROM php:7.4-apache`.
2. **Fight (`/fight`).** Same `gpt-6-luna` through Mubit, two routes, two real `mreq_` IDs. The plain prompt guessed 8.4 and named no pins. The Open Patch task named Dockerfile, Composer, CI and `.php-version` under the house rule.
3. **The patch.** Only the pins move; application source doesn't.
4. **Any repo, live.** Paste PHP-Calculator: 7.4 → 8.2, 2 files, 3 lines, applies cleanly.
5. **The Mubit console, as it is.** One task, 660 calls, 44 kept, adapter v1 on Silent test at 33.3% of a 95% target. Not Passed, and we say so.

## How Mubit is used

- **One frozen task.** Every plan is a call to one Mubit task, `PatchPilot's advisory-to-migration-plan 3`, through `https://api.mubit.ai/openai/v1` with the same system prompt, model (`gpt-6-luna`) and JSON output format. The prompt is frozen on purpose: changing one word would start a new task and lose the kept examples. Repo evidence, advisory, house rule and reviewer notes all travel in the user message.
- **Small, keepable requests.** We send Mubit only the evidence that decides the runtime (Dockerfile, manifests, CI, version files), never application source. That cut requests from up to 330 KB to under 15 KB and plan latency from about 40 s to 12–16 s.
- **Real traffic as training data.** Each check is one recorded call with its own `metadata.session_id`. On 24 Oct we ran 500+ public PHP, Node and Python repos through `POST /api/fleet/check` (`scripts/fleet.mjs`): 660 calls on the task in 7 days.
- **Corrections close the loop.** A reviewer's correction is sent back to the same task as a new example. Repair retries, the Fight baseline and held-out evaluation use `x-middleware-store: false`, so they can't pollute training.
- **Honest status.** The adapter (Qwen3-4B, v1) scores 33.3% against Mubit's 95% target, with the base model alone at 8.3%. It is on a 10% silent test, not Passed, so every reply is still `gpt-6-luna`. Mubit's daily review limit left most of the new calls unreviewed on 24 Oct. See [`submit/ADAPTER-CEILING-NOTE.md`](submit/ADAPTER-CEILING-NOTE.md).

## How it works

| Step | What happens | Code |
| --- | --- | --- |
| Intake | Public GitHub archive or ZIP. Nothing in the repo runs. Path traversal, symlinks, size and depth limits enforced. | `src/lib/repo/` |
| Exposure | `affected`, `not_affected` or `unknown` from the pins that exist. Never a confident guess. | `src/lib/analysis/exposure.ts` |
| Plan | Frozen Mubit task, compact user message, house rule PHP 8.2.35+. | `src/lib/llm/plan.ts`, `src/lib/llm/mubit.ts` |
| Patch | Moves only pins that exist; composer.json is edited in place, so the diff stays small. | `src/lib/patches/` |
| Checks | Allowlisted static checks. Missing pin = skipped, failed pin = `incomplete`. | `src/lib/checks/` |
| Verify | Banyan Sapling scores policy + evidence + claim. `unsure` stays `uncertain`. | `src/lib/sapling/client.ts` |

Open Patch is not a scanner (Snyk, Sonar) and not a code editor (OpenHands, Aider). It sits between them: a finding goes in, a policy-checked, pin-only patch comes out.

## Setup

```bash
git clone https://github.com/Ahamisi/open-patch.git
cd open-patch
cp .env.example .env
# put your Mubit key in .env — server-side only
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a public GitHub repo link. `/fight` is the same-model A/B. A ZIP upload and offline samples are under **More options**.

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

Paste any of these on the home page. All were run end to end on 24 Oct:

| Link | What you'll see |
| --- | --- |
| `https://github.com/sspangsberg/PHP-Calculator` | affected, PHP 7.4 → 8.2, Dockerfile + composer.json |
| `https://github.com/ucan-lab/docker-laravel-alpine` | affected, `docker/php/Dockerfile` |
| `https://github.com/r3dlin3/phpOIDC` | affected, Dockerfile + `phpOp/composer.json` |
| `https://github.com/symfony/demo` | not affected (8.4.1), nothing to change |
| `https://github.com/laravel/laravel/tree/v8.6.12` | unknown: `^7.3\|^8.0` could be either |

Harbor Ledger is a **synthetic fixture we wrote** (not a real company) for a reliable offline PHP 7.4 case. You can also download a ZIP and upload it:

- [laravel/laravel 12.x](https://github.com/laravel/laravel/archive/refs/heads/12.x.zip)
- [laravel/laravel v8.6.12](https://github.com/laravel/laravel/archive/refs/tags/v8.6.12.zip)
- [slimphp/Slim-Skeleton](https://github.com/slimphp/Slim-Skeleton/archive/refs/heads/master.zip)
- [symfony/demo](https://github.com/symfony/demo/archive/refs/heads/main.zip)

Exposure is computed from whatever is actually in the archive. A modern Laravel skeleton with `require.php: ^8.2` and no Docker pin is inferred as `not_affected` for the 7.4 EOL advisory, with that limitation stated. An older `^7.3|^8.0` constraint without a pin is `unknown`.

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

- PHP first: pin patches target PHP 8.2 (8.2.35+). Node 16 and Python 3.8 advisories are checked; their pin rewrites are not demoed.
- PHP 7.3 and older read as outside the 7.4 EOL advisory range today.
- Public GitHub links and ZIP uploads only. We do not open the pull request for you; you apply the patch and push the branch.
- Checks are allowlisted static parsers. Composer scripts, container builds, and repository CI are never executed.
- Production OS/SAPI is not observed; Windows CGI stays `unknown`.
- Sapling classifies supplied text. It is not a scanner or exploit proof.
- No adapter is live. The UI says `Check Mubit console` and shows the dated snapshot above.

## Safety

- ZIP path traversal, symlinks, size, depth, and file-count limits are enforced.
- Repository README and comments cannot override system instructions.
- No automatic merge or deploy.
- Secrets stay in environment variables.
