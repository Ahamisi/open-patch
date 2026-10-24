# Open Patch — PDF deck kit (Night Shift)

Build in Keynote / Google Slides / Pitch. Export **PDF**. Keep it **10–12 slides**. Dark background, one idea per slide. The 3-minute video does the click-through; the deck is the story a Mubit judge can flip in 90 seconds.

**Repo:** https://github.com/Ahamisi/open-patch  
**Live console task:** `PatchPilot's advisory-to-migration-plan 3`  
**Do not edit the frozen system prompt.**

---

## Story in one breath

This week php2shell landed in the PHP *engine*, not in app code. CISA said patch or take unsupported PHP offline. Sonar said scan the *image*. Teams will paste each repo into Claude. Uber already blew a year’s AI budget in four months doing that class of work. Open Patch is the layer that decides the *legal* migration, checks the claim with Banyan Sapling, and trains one Mubit task so the 80th repo does not pay frontier again.

---

## Slide-by-slide

### 1 — Title
**Open Patch**  
Policy-aware runtime migrations. Verified by Sapling. Learned on Mubit.

Sub: Night Shift · London · 24–25 Oct 2026  
Not another tool that patches code.

Speaker: “We do not rewrite Invoice.php and call the CVE fixed.”

### 2 — This week’s fire (live vuln)
**php2shell — 21 October 2026**

- CVE-2026-109618 and CVE-2026-109619. CVSS 9.2. Unauthenticated RCE in PHP itself.
- Fixes: **8.2.35, 8.3.36, 8.4.27, 8.5.12**. PHP 8.1 and older: **no official patch**.
- CISA: identify every PHP install; unsupported versions should go offline until upgraded.
- Sonar (22 Oct): code scan and Composer scan will **not** see this. It lives in the image / runtime.

Citations (footer, small):
- https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching
- https://www.cve.org/CVERecord?id=CVE-2026-109618
- https://www.sonarsource.com/blog/container-scanning-open-beta/

Speaker: “The lock on the building was redesigned. Redecorating the office does not change the lock.”

### 3 — The wrong fix
**What Claude does when you paste the CVE + Invoice.php**

Left column: “Sanitize Invoice.php. Leave php:7.4-apache. Call it fixed.”  
Right column: “You are still running the unpatched engine.”

One line: **Finding ≠ legal plan. Source ≠ interpreter.**

### 4 — Why this is a recurring bill
**Companies are burning a year’s AI budget in a quarter.**

- Uber: entire **2026 AI coding budget gone in four months** after Claude Code rollout. Heavy users $500–$2,000 / month. One 2-hour session: **$1,200**. Then a **$1,500 / employee / tool** cap.
- Same quarter: enterprises reported annual AI budgets gone in ~**3 months**; Microsoft pulled many internal Claude Code seats on cost.

Citations:
- https://techcrunch.com/2026/06/02/uber-caps-employee-ai-spending-after-blowing-through-budget-in-four-months/
- https://finance.yahoo.com/technology/ai/articles/uber-blew-entire-2026-ai-145000897.html

Speaker: “php2shell is one ticket class. A platform team has hundreds of repos. Each Claude chat is a full-price frontier call that forgets last week’s correction. That is how the year dies in Q1.”

### 5 — What we built
**One skill. Many repos. Team rules in the user message.**

1. Inventory pins that exist (Docker, Composer, CI, `.php-version`). Scripts never run.
2. Classify `affected` / `not_affected` / `unknown`.
3. Same frozen Mubit task every time (`advisory_to_migration_plan`).
4. Move only pins that exist. Missing files are skipped, not failed.
5. Banyan Sapling scores a specific claim. **Unsure stays unsure.**
6. A human correction is the next example of the **same** task.

House rule tonight: **8.2**, not a blind jump to 8.4. Flip to 8.3 = one user-message field. Not a new model.

### 6 — Use cases
**Review. Migrate. Patch. Against the rules you already wrote.**

- **Code review:** house line is 8.2. That reviewer note is the next plan, not another PR argument.
- **Migration:** eighty repos, one advisory. PHP tonight. Node and Python packs already ship.
- **Patching:** move locks that exist. Skip missing. Unsure stays. Human merges.

Speaker: “Every engineering team already does these three jobs. We just stop them paying frontier to ignore their own rules.”

### 7 — How you tap in
**Bring the policy you already have.**

1. Attach SEC-RUNTIME-01 or yours. Flip 8.2 → 8.3 is one field.
2. ZIP or fixture. Scripts never run.
3. Frozen Mubit task. Pins only.
4. Sapling scores *that* policy. Correction is the next example. You merge.

### 8 — Pricing (proposed)
**Not a $1,500 / head copilot.**

- Today: $1,200 / two-hour session, then Uber’s $1,500 / employee / tool cap.
- Night Shift design partner: **$0**.
- Team: **$499 / mo** — 1 policy, 50 repos.
- Platform: **$1,999 / mo** — 500 repos, many policies. Repo 80 is the same invoice.

Say “proposed, not live billing.”

### 9 — Pins, in one picture
Four locks on Harbor Ledger, all still **7.4**:

| Pin | What it locks |
| --- | --- |
| `Dockerfile` `FROM php:7.4-apache` | The box production often *is* |
| `composer.json` `>=7.4 <8.0` | What the project will even install |
| `.github/workflows/ci.yml` `7.4` | What “green” means |
| `.php-version` `7.4.33` | What local tools start |

We do **not** rewrite `Invoice.php` for this CVE. We change the locks so the next deploy can run a PHP that already has the fix.

### 10 — Live A/B (your fight screen)
**Same model (`gpt-6-luna`). Two routes. Two request IDs.**

| | Plain frontier | Open Patch |
| --- | --- | --- |
| Input | Advisory + Invoice.php (ChatGPT paste) | Frozen task + full pins + policy |
| It knew | Source cannot patch the engine | Same, then named the four files |
| It missed | No pins, guessed 8.3/8.4 | House **8.2**, pins actually moved |
| Sapling raw | **violation ~50%** | **supported ~56%** |
| Calibrated | unsure (shown) | unsure (shown) |

Screenshot: `/fight` split.  
Screenshot: two `mreq_…` IDs.

Speaker: “Claude can say the right sentence and still lose. No evidence, no team floor, Sapling calls it a violation.”

### 11 — Banyan Sapling is the referee
They launched it tonight. We already call it.

- Three strings: policy, evidence, claim.
- Labels: supported / violation / insufficient / inconsistent / **unsure**.
- We do not convert unsure to a pass. Scores stay on screen.

Citation: https://huggingface.co/MubitLabs/banyan-sapling

Speaker: “Mubit staff built this model to say when it does not know. We use that. We do not hide it.”

### 12 — The Mubit loop (refresh numbers before you export)
**This is the slide you update last.**

**As of 17:25 Sat 24 Oct (live console, innerText):**

- Task: `PatchPilot's advisory-to-migration-plan 3`
- **102 calls · 36 kept · 0.0% answered by our model**
- Status: **v1 Silent test (10%)** · exam **33.3% / 95%** · not Passed
- Provider: `gpt-6-luna` 100%
- History: last two reviewer batches **24 new calls, 0 kept, 0 rejected**
- Do **not** start another training on the same 36. The exam cannot move.

Try models compare **ran**. Include it:

- Left `gpt-6-luna` (Mubit Cloud): **502 · provider 401**
- Right plan 3 v1: answered in ~4.5 s (investigate; no invented 8.2)
- Same luna through our Mubit key (Fight / stored-false ping): **200**

Say that in one breath: “The console compare hop 401’d. The adapter still answered. The app still reaches luna.”  
Do **not** say OpenAI is down. Do **not** treat the 401 as the A/B win. Fight is the A/B.

If History later says **Passed**, keep the 401 line unless a re-run fills the left column. Never paste a fake luna reply.

Screenshot: Tasks page + Try models with the 401 still visible.

### 13 — Why not the obvious products

| They | We |
| --- | --- |
| **Snyk / Sonar** find the CVE or the dirty image | We decide the *legal repo change* |
| **OpenHands / Aider** edit the tree | We do not reinvent the editor |
| **Claude skill file** shares a recipe; every call still pays frontier | Mubit trains and *measures* one task |
| **FixOnce Python adapter** (136 examples, Silent test 50%) | Wrong task. We do not steal it. |

### 14 — What we will not say
- We patched php2shell.
- We rewrote Harbor’s PHP to 8.4.
- Anthropic is a subscriber.
- The leftover Python row is our adapter.
- Unsure means verified.
- Try-models junk samples (lodash RCE, SQL injection) are our eval.
- The Try models 401 means luna is down, or that we beat OpenAI.

One honest limitation line: **pins are necessary, not always sufficient.** 7.4 syntax can still break on 8.2. Human approval exists for that. Source-compat is the next pass, not tonight’s claim.

### 15 — Close
**One skill. 500 repos. Team rules attached. Claim scored. Human merges.**

Repo · Fight URL · Console task name · “Ask us to run it.”

---

## Screenshots to capture (do these now)

1. Fight landing + finished A/B (violation vs supported).
2. Harbor scan: four 7.4 pins, `affected`, pins moved to 8.2.
3. Mubit Tasks: plan 3, kept count, Training or Passed.
4. Mubit Requests: two `mreq_` IDs from the last fight.
5. Try models: Side by side · samples = plan 3 · Left **gpt-6-luna** · Right **plan 3 v1**. Keep the **502 / provider 401** in frame. Do not use Gemini. Do not pick Python v1. Do not use the auto Samples. Do not crop the error.

---

## Design notes

- Dark, `#07080b`, ember accent. Same as the app.
- Max 20 words in the headline. Body is bullets.
- Put every URL in 9pt footer. Judges click.
- No stock “AI brain” art. Use *your* UI.
- 16:9. One PDF. File name: `Open-Patch-Night-Shift.pdf`.

---

## Video (record after the deck outline is locked)

3:00 max. Open `/fight`, then console.

| Time | Screen | Line |
| --- | --- | --- |
| 0:00–0:20 | Title / CISA | php2shell is in the engine. 8.1 and older have no patch. |
| 0:20–0:50 | Fight | Same luna, two routes. |
| 0:50–1:30 | Scores | Violation vs supported. Unsure stays. |
| 1:30–2:10 | Pins + patch | Four files moved. Invoice.php untouched. |
| 2:10–2:40 | Console | Plan 3, 102 calls, 36 kept, Silent test 33.3%. Not Passed. |
| 2:40–3:00 | Close | Uber blew the year in four months repeating frontier chats. This is the task you train once. |

---

## `/checkin` (afternoon)

**Shipped:** Fight A/B live (luna vs Open Patch, Sapling violation vs supported). Plan 3 v1 Silent test 33.3%, **102/36 kept**. Video `submit/Open-Patch-demo-fight.webm`. Repo github.com/Ahamisi/open-patch.

**Next:** Export PDF from SLIDES.md. Upload packet. Discord /checkin. No more example dumps. No second train.

**Blockers:** Adapter not Passed. Last 24 reviewer calls kept 0. Try models left column 401 on Mubit Cloud; luna via our key still 200. Will not claim the Python 50% row. Will not claim we stopped php2shell — PHP.net patched the engine; IppSec/Hutchins say public PoCs are mostly junk.
