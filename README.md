# Open Patch

**php2shell is a bug in the PHP engine, not in your app.** Rewriting `Invoice.php` doesn't fix it; moving the runtime to a patched PHP does. Open Patch takes a repository, finds the PHP version it actually runs, plans the upgrade under your team's policy with [Mubit](https://docs.mubit.ai/), and hands you a patch that changes only the version pins. A person reviews and merges.

Built for Mubit [Night Shift](https://luma.com/nightshift-london), London, 24–25 Oct 2026.

## Who it's for

Anyone who owns more code than they can read when an engine-level advisory lands:

| Team | Their week when php2shell lands | What Open Patch gives them |
| --- | --- | --- |
| **Platform / DevOps** owning dozens of services on shared base images | Work out which Dockerfiles, CI matrices and version files still say 7.4, repo by repo | A verdict per repo in 15–40 s and a pin-only patch they can branch and merge |
| **Security / AppSec** who receive the advisory | Prove exposure across the fleet and stop "we fixed it" claims that only touched app code | `affected` / `not_affected` / `unknown` with the evidence behind it, an independent Sapling verdict, and a Mubit request ID per plan |
| **Agencies and consultancies** running many client PHP sites (Laravel, WordPress, Symfony, CodeIgniter) | The same upgrade dozens of times, each with a different layout | One flow for every client repo; private code by ZIP upload |
| **SaaS teams** with a legacy monolith plus newer services | Find the forgotten service still on an old runtime | The forgotten one shows up as `affected`; the modern ones come back `not_affected` with nothing to change |
| **Hosting providers / MSPs** | Tell customers exactly what to change | A patch and PR description the customer can apply themselves |
| **Teams using AI coding agents** | Agents "fix" CVEs by rewriting source | A plan that says which files may change, and that a code edit can't fix an interpreter |

## Use cases

1. **Engine CVE day (php2shell).** Paste each repo, get the verdict and a patch that moves the runtime to 8.2.35+, review, merge. No application code changes, so the review is a few lines.
2. **End-of-life migrations.** PHP 7.4 EOL today; Node 16 and Python 3.8 EOL advisories run through the same checks. The house rule (for example "PHP 8.2.35 or later") is one field, so every plan follows the team's policy instead of a model's guess.
3. **Fleet sweep.** `POST /api/fleet/check` (driven by `scripts/fleet.mjs`) runs one advisory across hundreds of public repos and returns exposure plus a Mubit plan for each. We ran 500+ repos through it on 24 Oct.
4. **Honest triage.** Repos without a clear pin come back `unknown`, with the plan listing what's missing (production image, CI version), rather than a confident wrong answer.
5. **Change evidence.** Each check keeps the evidence IDs, the plan's Mubit request ID, the checks that ran or were skipped, and Sapling's raw verdict: what a reviewer or a change record needs.
6. **A guardrail for AI agents.** The pin-only plan is the brief you hand to an editor (Copilot, Claude, OpenHands). Open Patch decides what may change; the editor doesn't get to rewrite `Invoice.php`. (The editor integrations aren't wired yet.)
7. **Learning from every review.** When a reviewer corrects a plan, the correction goes back to the same Mubit task, so the next plan for the next repo starts from the team's own judgment.

**Why it matters:** an engine CVE is one ticket repeated across every repo, all year. Pasting each repo into a frontier chat costs a long session per repo and still leaves the vulnerable runtime in place; one company reportedly burned a year of AI coding budget in four months (TechCrunch, 2 Jun 2026). Open Patch turns that into one recorded, policy-bound task with a small, reviewable patch per repo.

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

## What the demo video shows (1:58)

**Watch it:** [`docs/open-patch-demo.mp4`](docs/open-patch-demo.mp4) (1:58, 1080p, 54 MB; GitHub shows "View raw" to play or download).

| Time | What you see |
| --- | --- |
| 0:00–0:26 | **The problem.** php2shell (CVE-2026-109618 / 109619, 21 Oct 2026): unauthenticated RCE in PHP itself, fixed only on 8.2.35, 8.3.36, 8.4.27 and 8.5.12; 8.1 and older are out of support. |
| 0:26–0:40 | **The wrong fix.** A chatbot rewrites the app code and says it's fixed; the Dockerfile still says `php:7.4-apache`. |
| 0:40–0:59 | **Fight (`/fight`).** Same `gpt-6-luna` through Mubit, two routes, two real `mreq_` IDs. The plain prompt guessed 8.4 and named no pins; the Open Patch task named Dockerfile, Composer, CI and `.php-version` under the house rule. |
| 0:59–1:11 | **The referee.** Banyan Sapling scores the plain route a violation (45.4%) and Open Patch supported (56.0%). Both are calibrated `unsure`, and we leave that on screen. |
| 1:11–1:20 | **The patch.** Four pins move; application source doesn't. |
| 1:20–1:30 | **A real repo, end to end.** Paste PHP-Calculator, Mubit plans it, the verdict shows "7.4 → 8.2, two files" with its Mubit request ID, and the three-line diff applies with `git apply`. Real app screenshots from a live run. |
| 1:30–1:42 | **The Mubit console.** One frozen task: 660 calls, 44 kept, adapter v1 on Silent test at 33.3% of a 95% target, and the new pin-decision task (404 calls, in review) that is built to train faster. |
| 1:42–1:52 | **Where it goes next.** PHP is this week's fire; tomorrow it's Node, Python, a leftover OpenSSL, an abandoned npm lock. Same loop: review, migrate, patch, against the rules a team already wrote. |
| 1:52–1:58 | **End card.** PHP tonight, every pin tomorrow. github.com/Ahamisi/open-patch |

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
| Patch | Moves only pins that exist; composer.json is edited in place, so the diff stays small. The patch is a real unified diff, fuzz-tested against `git apply` on 3,000 random edits. | `src/lib/patches/` |
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

### Second task: pin decision (started 25 Oct 2026, 00:55 London)

Plan 3 asks a 4B adapter to reproduce long free-text plans, and v1 matches about a third of them. So we opened a second, narrower Mubit task with its own frozen prompt, `PIN_SYSTEM_PROMPT` in [`src/lib/llm/pin-task.ts`](src/lib/llm/pin-task.ts). It returns short JSON: exposure, detected version, the exact pin lines to change, and a one-line reason. Example from a real call on `sspangsberg/PHP-Calculator`: `dockerfile php:7.4-fpm-alpine → php:8.2-fpm-alpine`, `composer.json 7.4.0 → 8.2.35`.

| Fact | Value (console, 00:57 London) |
| --- | --- |
| Task | `Open Patch's pin-decision task`: Reviewing examples |
| Calls / kept | 404 / 0 so far (reviewer has not judged the batch yet) |
| Training | starts at 25 kept; not started |
| Served by | `gpt-6-luna` |

Feed it with `npm run dev` and `node scripts/fleet-pins.mjs 400` (route: `POST /api/fleet/pins`). The Mubit console is the authority; nothing in Open Patch is served by either adapter tonight.

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
