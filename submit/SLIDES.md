# Open Patch — paste-ready slides

Copy each block into one slide. Dark background. Headline 40pt. Bullets 20pt. Footer 10pt.

**Adapter status for export (24 Oct, 17:25 London):**  
plan 3 · **v1 on Silent test (10%)** · **102 calls** · **36 kept** · exam **33.3% / 95%** · answered by our model **0.0%** · not Passed.  
Last reviewer batches: **24 new calls, 0 kept, 0 rejected**. Another train on the same 36 examples will not move the exam.  
Try models: left luna on Mubit Cloud **502 / provider 401**. Same luna through our `mbt_` key: **200**. Fight is the A/B.  
Fable: use `open-patch-video-export/FABLE-DIRECTOR.md`. Slide 11 in the Night Shift HTML is already this snapshot.

---

## Slide 1 — Title

**Open Patch**

The system that decides which migration is legal.

Night Shift · London · 24–25 Oct 2026  
Verified by Banyan Sapling · Learned on Mubit

Footer: github.com/Ahamisi/open-patch

---

## Slide 2 — This week

**php2shell landed in the engine, not in your app.**

21 October 2026 · CVE-2026-109618 · CVE-2026-109619 · CVSS 9.2  
PHP.net: unauthenticated request can fire **before any application code** (highest risk: mod_php).

Patched only on: **8.2.35 · 8.3.36 · 8.4.27 · 8.5.12**  
PHP 8.1 and older: **no official fix.** CISA (updated 23 Oct): inventory, patch, or take them offline.

Docker / Black Duck: Composer will not list the interpreter.  
Updating the runtime is the only complete fix.

Footer: php.net/archive/2026.php · cisa.gov · docker.com/blog/security-update-on-php2shell-impact-for-docker-customers · blackduck.com/blog/php2shell-find-fix-exposure-sca.html

---

## Slide 3 — The wrong fix

**Claude rewrites Invoice.php. The lock is still 7.4.**

Left: “Sanitize the calculator. Call the CVE fixed.”  
Right: `FROM php:7.4-apache` is still the box.

Finding ≠ legal plan.  
Source ≠ interpreter.

---

## Slide 4 — The bill

**This is how a year of AI budget dies in a quarter.**

Uber burned its **entire 2026 AI coding budget in four months** after rolling out Claude Code.  
Heavy users: $500–$2,000 / month. One two-hour session: **$1,200**.  
Then a **$1,500 per employee per tool** cap.

A platform team will do php2shell **once per repo**, all year.  
Each Claude chat is a full-price frontier call that forgets last week’s correction.

Footer: techcrunch.com/2026/06/02/uber-caps-employee-ai-spending-after-blowing-through-budget-in-four-months

---

## Slide 5 — The product

**One skill. Many repos. Team rules attached.**

1. Read the pins that exist. Scripts never run.  
2. Say affected / not_affected / unknown.  
3. Same frozen Mubit task, every time.  
4. Move only files that exist. Skip missing. Do not merge.  
5. Sapling scores the claim. Unsure stays on screen.  
6. A human note is the next example of that task.

House rule tonight: **8.2**, not a guessed 8.4.  
Flip to 8.3 = one field in the user message. Not a new model.

---

## Slide 6 — Use cases

**Review. Migrate. Patch. Against the rules you already wrote.**

**Code review** — Stop arguing 8.4 in every PR. The reviewer already said house line is 8.2. That note is the next plan.

**Migration** — Eighty repos. One advisory. PHP this week. Node 16 and Python 3.8 already ship. Repo 80 is cheaper than repo 1.

**Patching** — Move the locks. Leave the app. Missing files skipped. Unsure stays. Human merges. No auto-deploy.

---

## Slide 7 — How you tap in

**Bring the policy you already have.**

1. Attach SEC-RUNTIME-01 — or yours. 8.2 tonight. Flip to 8.3 = one field. Not a new model.
2. Drop a ZIP or pick a fixture. We never run your scripts, CI, or containers.
3. Inventory pins. Frozen Mubit task. Move only files that exist.
4. Sapling scores **that** policy. Your correction is the next example. You merge.

Snyk still finds. Your editor still edits. We are the missing middle.

---

## Slide 8 — Pricing (proposed, not live billing)

**You already paid for the rules. Do not buy another $1,500 seat.**

| | What it is |
| --- | --- |
| Today | **$1,200** / two-hour frontier session. Then **$1,500 / employee / tool**. |
| Night Shift | **$0** design partner. Prove it on your house rule. |
| Team | **$499 / mo** — 1 policy, 50 repos, review + migrate + patch. |
| Platform | **$1,999 / mo** — many policies, 500 repos. Repo 80 is the same invoice. |

Not a per-engineer copilot. One decision layer. Human still merges.

---

## Slide 9 — What a pin is

**Four locks. All still 7.4. That is the upgrade.**

| File | What it locks |
| --- | --- |
| Dockerfile `php:7.4-apache` | The box production often is |
| composer.json `>=7.4 <8.0` | What the project will install |
| CI `php-version: 7.4` | What “green” means |
| `.php-version` `7.4.33` | What local tools start |

We do not rewrite Invoice.php for this CVE.  
We change the locks so the next deploy can run a PHP that already has the fix.

---

## Slide 10 — Live A/B

**Same gpt-6-luna. Two routes. Two request IDs.**

**Plain frontier** — advisory + Invoice.php, no policy, not stored.  
Knew source cannot patch the engine. Named no pins. Guessed 8.3/8.4.  
Sapling raw: **violation ~50%**. Calibrated: unsure.

**Open Patch** — frozen task, full pins, house 8.2.  
Named Docker, Composer, CI. Moved them. Checks passed.  
Sapling raw: **supported ~56%**. Calibrated: unsure.

Screenshot: Fight split.

---

## Slide 11 — The referee

**Banyan Sapling launched tonight. We already call it.**

Three strings: policy · evidence · claim.  
Five answers: supported · violation · insufficient · inconsistent · **unsure**.

We do not turn unsure into a pass.  
A high raw score is not production-safe.

Footer: huggingface.co/MubitLabs/banyan-sapling

---

## Slide 12 — Mubit  *(export this last)*

**DEFAULT — Silent test, not Passed**

plan 3 **v1** · Silent test **33.3% / 95%**  
**102** calls · **36 kept** · 0.0% answered by our model  
Not on rollout. Not live. Not a cheap specialist in production.

**Try models, same Harbor prompt, 24 Oct**

Left `gpt-6-luna` (Mubit Cloud): **502 · provider 401**  
Right plan 3 v1: JSON plan in **~4.5 s** · investigate · no invented 8.2  
Footer: not stored · trains nothing.

That 401 is the **console compare hop**, not our product.  
A stored-false luna call through our `mbt_` key still returned **200**.  
Fight is the A/B. This screenshot is the honest console.

Screenshot: Try models 401 left / adapter right. Do not crop out the error.

**SWAP only if History later says Passed**

plan 3 **v1 Passed**.  
Re-run Try models vs **gpt-6-luna** (not Gemini, not the leftover Python adapter).  
If luna 401s again, say so. Do not paste a fake left column.

---

## Slide 13 — Why not them

**They find or they edit. We decide, constrain, verify, teach.**

Snyk / Sonar — find the CVE or the dirty image.  
OpenHands / Aider — edit the tree.  
Claude skill — share a recipe; every call still pays frontier.  
FixOnce Python adapter — 136 examples, Silent test 50%. **Wrong task. We did not steal it.**

---

## Slide 14 — Honest limits

**Pins are necessary. They are not always sufficient.**

7.4 syntax can still break on 8.2. A human still approves.  
We did not patch php2shell. The PHP project did, on supported lines.  
We did not train a PHP rewriter.  
We did not assume the adapter passed.  
We did not hide the Try models 401, and we did not call it a beat.  
IppSec / Hutchins (23 Oct): most public “php2shell PoCs” are AI session-poisoning junk. Sky is not falling. We still move the pins.

---

## Slide 15 — Close

**One skill. 500 repos. Team rules attached. Claim scored. Human merges.**

github.com/Ahamisi/open-patch  
localhost fight: same model, two routes  
Console: PatchPilot's advisory-to-migration-plan 3

Ask us to run it.
