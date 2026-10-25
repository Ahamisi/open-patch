# Open Patch

**php2shell is a bug in the PHP engine, not in your app.** Rewriting `Invoice.php` doesn't fix it; moving the runtime to a patched PHP does. Open Patch takes a repository, finds the PHP version it actually runs, plans the upgrade under your team's policy with [Mubit](https://docs.mubit.ai/), and hands you a patch that changes only the version pins. A person reviews and merges.

Built for Mubit [Night Shift](https://luma.com/nightshift-london), London, 24–25 Oct 2026.

**Try it live: [open-patch.onrender.com](https://open-patch.onrender.com)**. Paste any public GitHub repo; each check is a live Mubit call. Free hosting, so the first visit after a quiet spell can take about 50 s to wake up. **Demo video:** [`docs/open-patch-demo.mp4`](docs/open-patch-demo.mp4) (1:58).

## Why it matters

An unpatched runtime isn't an abstract risk: it's where people's money and records sit. In 2017, Equifax left a known, already-fixed flaw in a framework unpatched, and the personal data of about 147 million people was exposed. Its settlement with US regulators alone was up to $700 million, and IBM's 2024 breach study puts the average breach at $4.88 million. Across thousands of companies on old runtimes, that is billions of dollars of damage that a version bump prevents. php2shell is the same shape: unauthenticated remote code execution in the PHP engine, which runs a large share of the web, including payment pages, savings and lending apps, school and clinic portals, and small businesses' shops. The fix already exists on supported PHP lines. What's missing is the time to find every repo still pinned to an old runtime and move it, safely, before someone else finds it first. Open Patch turns that into minutes per repo, and Mubit makes each repo cheaper than the last.

## Why Mubit: repo eighty shouldn't cost a frontier call

A large team doesn't patch one repo. It runs the same migration (an engine CVE, an EOL runtime, a base-image bump) across dozens or hundreds of repos, and every repo through a frontier model is a full-price call that has forgotten last week's corrections. Open Patch sends every check through one frozen Mubit task instead:

1. **Every call is a training example.** The frontier model (`gpt-6-luna`) answers through Mubit, and Mubit's reviewer keeps the good answers as examples of that one task.
2. **Mubit trains a small specialist.** Once a task has enough kept examples, Mubit trains a 4B adapter (Qwen3-4B) on them and tests it against the frontier model's answers on held-out cases.
3. **Corrections retrain it.** When a reviewer fixes a plan, the correction goes back to the same task as a new example, and the next version learns the team's own rules.
4. **The cheap model takes over when it's good enough.** Mubit runs the adapter in silent test, then canary, then promoted. Only once it matches the frontier model on the team's task do later repos stop paying frontier prices for an answer the team has already taught it.

Tonight that loop really ran, over 1,000 calls across three tasks, and each task got tighter: plan 3's first adapter scored 33.3%, the pin-decision adapter 56.7%, and the **pin-list task's v1 scored 100% on 29 held-out test cases, against an 85% target ("Target met")**. On that task the small Qwen3-4B model with our prompt gives the same answer as the frontier model on every held-out case, so those calls don't need the frontier model at all. It is in silent test now; Mubit moves it to canary once 50 live pairs across 10 sessions are graded. Details under [Adapter status](#adapter-status-console-is-the-authority).

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

1. Open [open-patch.onrender.com](https://open-patch.onrender.com) (or run it locally, see Setup), paste a public GitHub link, for example `https://github.com/sspangsberg/PHP-Calculator`, and click **Check my repo**.
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
| 1:30–1:42 | **The Mubit console.** Plan 3: 660 calls, 44 kept, adapter v1 at 33.3%. Then the Adapters page at 04:30: the new pin-decision task's v1, trained overnight, at 56.7% on 30 test cases (target 95%, Silent test). |
| 1:42–1:52 | **Where it goes next.** PHP is this week's fire; tomorrow it's Node, Python, a leftover OpenSSL, an abandoned npm lock. Same loop: review, migrate, patch, against the rules a team already wrote. |
| 1:52–1:58 | **End card.** PHP tonight, every pin tomorrow. github.com/Ahamisi/open-patch |

## How Mubit is used

- **Three frozen tasks, each a separate Mubit adapter.** Every LLM call goes through `https://api.mubit.ai/openai/v1` with `gpt-6-luna`. A task's system prompt never changes once traffic starts, because one changed word starts a new task; everything that varies (repo evidence, advisory, house rule, reviewer notes) travels in the user message.
  1. `PatchPilot's advisory-to-migration-plan 3`: the full migration plan the app shows (`PLAN_SYSTEM_PROMPT`).
  2. `Open Patch's pin-decision task`: just the pin decision as short JSON (`PIN_SYSTEM_PROMPT`), opened 25 Oct 00:55.
  3. `Open Patch's pin-list task`: the same decision with no free text at all (`PIN_V2_SYSTEM_PROMPT`), opened 25 Oct 04:45.
- **Small, keepable requests.** We send Mubit only the evidence that decides the runtime (Dockerfile, manifests, CI, version files), never application source. That cut requests from up to 330 KB to under 15 KB and plan latency from about 40 s to 12–16 s. Pin-task requests are about 1 KB.
- **Real traffic as training data.** Each check is one recorded call with its own `metadata.session_id`. Overnight we ran public PHP, Node and Python repos from GitHub search through the tasks (`scripts/fleet.mjs`, `scripts/fleet-pins.mjs`): over 1,000 calls in 24 hours.
- **Corrections close the loop.** A reviewer's correction is sent back to the same task as a new example. Repair retries, the Fight baseline and held-out evaluation use `x-middleware-store: false`, so they can't pollute training.
- **What the three tasks scored (Qwen3-4B on Mubit, all in Silent test).** Pin list v1: **100% on 29 test cases, target 85%, "Target met"** (Mubit's v1 here is "prompt only": the base model with the task prompt already matched every case). Pin decision v1: 56.7% on 30 (base 50.0%, target 95%). Plan 3 v1: 33.3% on 12 (base 8.3%, target 95%). `gpt-6-luna` still serves every reply until Mubit promotes a version. Details under [Adapter status](#adapter-status-console-is-the-authority).

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

## Adapter status (console is the authority)

**Plan 3** (24 Oct, 22:45 London):

Task: `PatchPilot's advisory-to-migration-plan 3` (`ln_7b8e75ee6161e8c0ec917e8d`).

| Fact | Value |
| --- | --- |
| Adapter | v1, **Silent test 10%** — advisory exam, not production |
| Exam | v1: 33.3% vs 95% target on 12 held-out cases (base model + prompt: 8.3%) |
| Calls / kept | 660 / 44 (v1 trained on the first 36; most new calls not reviewed yet: daily review limit) |
| Answered by adapter | 0.0% |
| Served by | `gpt-6-luna` |

Silent test is **not** Passed. Open Patch still calls luna. A correction is stored as an example; it does not flip the served model. We will not claim a live trained version until the console says Passed and traffic is on that version. The Fight A/B is the same model on two routes, not adapter against provider. Why 95% is not reachable tonight: [`submit/ADAPTER-CEILING-NOTE.md`](submit/ADAPTER-CEILING-NOTE.md).

### Second task: pin decision (trained overnight, 25 Oct 2026)

Plan 3 asks a 4B adapter to reproduce long free-text plans, and v1 matches about a third of them. So at 00:55 we opened a second, narrower Mubit task with its own frozen prompt, `PIN_SYSTEM_PROMPT` in [`src/lib/llm/pin-task.ts`](src/lib/llm/pin-task.ts). It returns short JSON: exposure, detected version, the exact pin lines to change, and a one-line reason. Example from a real call on `sspangsberg/PHP-Calculator`: `dockerfile php:7.4-fpm-alpine → php:8.2-fpm-alpine`, `composer.json 7.4.0 → 8.2.35`. We fed it about 400 public repos; Mubit's reviewer kept the examples and the engine trained v1 within about three hours.

| Fact | Pin-decision task (console, 04:30 London) | Plan 3, for comparison |
| --- | --- | --- |
| Adapter | Qwen3-4B-Instruct-2507, v1, **Silent test 10%** | Qwen3-4B-Instruct-2507, v1, Silent test 10% |
| Exam | **56.7%** of the provider's answers matched on **30** test cases (base model + same prompt: 50.0%); needs 95% | 33.3% on 12 test cases (base model + prompt: 8.3%); needs 95% |
| Deployment history | "Step by the engine · v1: candidate → shadow · 10%" | same |
| Served by | `gpt-6-luna` (adapter is shadowing) | `gpt-6-luna` |

Same model size, same night: making the task narrower took the adapter from 33.3% to 56.7%, on a larger exam. Most of that gain is the task design (the base model with the same prompt already scores 50.0%); training added about 7 points.

**Why it still fails rows, from the console's Evaluations tab:** held-out row 2 has the same exposure (`unknown`), the same `detectedVersion` (`null`) and the same empty `changes` as the provider, and fails only because the one-line `reason` is worded differently ("The PHP version is not pinned in the evidence." vs "The available evidence does not pin a PHP version."). So at 04:45 we opened a third, fresh task, **pin list** (`PIN_V2_SYSTEM_PROMPT`, `task: "v2"`): no free text, every affected pin listed in a fixed order, so the provider's answer is fully determined by the evidence. Tested on PHP-Calculator (all three pins), docker-laravel-alpine (one) and symfony/demo (not affected, none). Feed it with `node scripts/fleet-pins.mjs 1000 v2`.

In Try models, the v1 adapter answered a PHP-Calculator pin input in 1.3 s in the task's exact JSON shape with the right exposure, but listed no pins. That is the kind of miss the next version has to fix. It is still below the 95% bar, so Mubit keeps it in silent test and luna answers every call. More traffic on this task is the path to v2. Feed it with `npm run dev` and `node scripts/fleet-pins.mjs 400` (route: `POST /api/fleet/pins`). The Mubit console is the authority.

### Third task: pin list, 100% on 29 test cases (console, 25 Oct, 09:45 London)

| Fact | Value |
| --- | --- |
| Task / adapter | `Open Patch's pin-list task` · `ad_lane_97cdec99` · Qwen3-4B-Instruct-2507 v1 |
| Exam | **100%** of 29 held-out test cases match the provider's recorded answer; **target 85%, "Target met"** |
| What v1 is | "Prompt only" / "rules only": the base model with the task's prompt. The console reports base model + prompt at 100% too, so no extra weights were needed |
| Status | Silent test (shadow 10%). Next step, canary: needs 50 graded live pairs across 10 sessions |
| Served by | `gpt-6-luna` until Mubit promotes it |

Our model next to the frontier model, copied from the console's Evaluations tab (held-out row 1, a repo with two pins to move):

```json
// Qwen3-4B on Mubit (pin-list v1)
{"exposure":"affected","detectedVersion":"7.4","changes":[
  {"file":"src/composer.json","from":"^7.4 || ^8.0","to":">=8.2 <8.4"},
  {"file":"docker/apache/Dockerfile","from":"php:7.4-apache","to":"php:8.2-apache"}]}

// gpt-6-luna (recorded provider answer)
{"exposure":"affected","detectedVersion":"7.4","changes":[
  {"file":"src/composer.json","from":"^7.4 || ^8.0","to":">=8.2 <8.4"},
  {"file":"docker/apache/Dockerfile","from":"php:7.4-apache","to":"php:8.2-apache"}]}
```

Row 15 (one Dockerfile, `php:7.4-apache` → `php:8.2-apache`) matches the same way. The other 27 cases are `not_affected` or `unknown` with no changes, and every one matches, including the detected version (`8.0.11`, `5.6`, `7.2`, `3.11`, `15.4.0` and so on). Being straight about the mix: 2 of the 29 cases needed pin changes, so the next exams should hold more `affected` repos.

What took it from 33% to 100% was the task design, not a bigger model. Plan 3 asks for a free-text plan. Pin decision asks for a short JSON with a one-sentence reason, and its failures were that sentence worded differently. Pin list removes the sentence and fixes which pins to list and in what order, so the right answer is fully determined by the evidence, and the small model gets it every time.

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
