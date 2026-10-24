# Fable brief — motion graphics director, not a carousel

You are a **motion graphics director** cutting a **product launch film for a judging room**, 16:9, max **2:50**. Dark `#07080b`, ember `#f5a524`. IBM Plex / Space Grotesk. No stock brains. No Ken Burns over a bullet list. No “story time” cards that sit still for eight seconds.

This is **not** a generic startup reel. The audience is **Mubit Night Shift, London, 24–25 Oct 2026**. ~500 teams. Official page: https://luma.com/nightshift-london. Every project **must** route app LLM calls through Mubit. Judges score four things equally:

1. **Use of Mubit** — a real task, real `mreq_` IDs, a correction that can become a kept example. Not “we called an API.”
2. **Usefulness** — a job a platform team would run on many repos this week.
3. **Technical execution** — inventory → plan → patch pins → checks → Sapling. No fake states.
4. **Demo** — live, under 3 minutes, inspectable.

**Why we built Open Patch:** php2shell (21 Oct) is in the PHP *engine*, not app source. Teams will paste each repo into Claude. Uber already blew a year of AI coding budget in four months doing that class of work. Scanners find the CVE or the dirty image. Editors rewrite the tree. Nobody decides the *legal* migration, scores the claim, or trains **one** task so repo 80 does not pay frontier again. That is the gap. We are not another Snyk, OpenHands, or Aider.

**What “use of Mubit” looks like on screen:** frozen task `PatchPilot's advisory-to-migration-plan 3`, two live request IDs, left route `store:false` so it cannot train, right route stored on plan 3, console 102 / 36 / Silent test 33.3%. Honest. Not Passed. Still luna until a version passes.

---

## The problem (learn this before you cut a frame)

A platform team owns **hundreds of old repos**. This week the fire is **php2shell** (21 Oct 2026, CVE-2026-109618 and CVE-2026-109619, CVSS 9.2). It is **unauthenticated remote code execution inside the PHP interpreter**. It can fire **before any application code runs** (highest risk: Apache `mod_php`). Hackers do not need a bug in `Invoice.php`. They need a server still running an unpatched PHP.

Fixes exist only on **8.2.35, 8.3.36, 8.4.27, 8.5.12**. PHP **8.1 and older have no official patch**. CISA (updated 23 Oct): find every PHP install; if you cannot patch, **take it offline**. PHP 7.4 is already end-of-life. IoT and “set and forget” boxes never get that update. That is the blast radius.

**The scanners cannot save you.** Sonar (22 Oct): code scan and Composer scan do not see this. Black Duck / Docker: the interpreter is **not in `composer.json`**. It lives in the **image and the pins**: `Dockerfile` (`FROM php:7.4-apache`), `composer.json` (`>=7.4 <8.0`), CI (`php-version: 7.4`), `.php-version` (`7.4.33`). Those four files are the lock on the building.

**What teams actually do, and why it fails**

1. Paste the CVE + `Invoice.php` into Claude / ChatGPT / luna.  
2. The model **rewrites application source** and says the CVE is fixed.  
3. `FROM php:7.4-apache` is still the box. The engine is still unpatched.  
4. They open the next repo and pay frontier again. The chat **forgets last week’s correction**.  
5. Uber burned its **entire 2026 AI coding budget in four months** doing that class of work, then capped **$1,500 per employee per tool**. One two-hour session: **$1,200**.

**Finding ≠ legal plan. Source ≠ interpreter.**  
Snyk/Sonar **find**. OpenHands/Aider **edit**. A Claude skill **shares a recipe** and still bills frontier every time. Nobody answers: *which files are we allowed to move, to which supported line, under this team’s house rule, and did the claim survive a referee?*

Public noise (IppSec, Hutchins): most GitHub “php2shell PoCs” are AI junk; the sky is not falling *yet*. We still move the pins. We do **not** claim we patched php2shell. PHP.net did, on supported lines.

---

## The solution Open Patch creates

**One skill. Many repos. Team rules in the user message.**

Harbor Ledger is the demo repo (synthetic municipal invoice app, still on PHP 7.4). Advisory: php2shell / 7.4 EOL. House rule tonight: **upgrade to 8.2**, the smallest supported patched line — not a blind jump to 8.4/8.5.

What the product actually does, in order:

1. **Intake** a ZIP or fixture. Never run untrusted repo scripts.  
2. **Inventory pins that exist.** Missing files are visible, not faked.  
3. **Exposure** is deterministic: `affected` / `not_affected` / `unknown`. Harbor is **affected at 7.4**.  
4. **Same frozen Mubit task every time** (`PatchPilot's advisory-to-migration-plan 3`). Model `gpt-6-luna`, same system prompt, `json_object`. Repo, advisory, evidence, reviewer notes live **only** in the user message. Edit the system prompt and you get plan 4 and lose the kept examples.  
5. **Patch only pins that exist.** Dockerfile, composer, `.php-version`, CI → **8.2**. `Invoice.php` is **not** in the diff.  
6. **Allowlisted checks.** Skip missing. Never fake a pass.  
7. **Banyan Sapling** scores a specific claim (policy + evidence + claim). Labels: supported / violation / insufficient / inconsistent / **unsure**. Unsure stays on screen.  
8. **Human correction** is the next example of that **same** task. Flip house rule 8.2 → 8.3 = one user-message field, not a new model.

**The knockout demo (already recorded):** same `gpt-6-luna`, two routes, two real `mreq_` IDs, ~19.5 s.

| | Plain frontier (ChatGPT-shaped paste) | Open Patch |
| --- | --- | --- |
| Input | Advisory + Invoice.php. No policy. `store:false` | Frozen task + four pins + house 8.2 |
| It did | Knew source cannot patch the engine. Guessed **8.4**. Named **no pins** | Named Docker, Composer, CI, `.php-version`. Moved them to **8.2** |
| Sapling raw | **violation ~45%** | **supported 56%** |
| Calibrated | **unsure** (shown) | **unsure** (shown) |

That is the product: **decide, constrain, verify, teach.** The cheap Mubit adapter is the *loop after* the legal plan. Tonight it is **Silent test 33.3% / 95%, 102 calls, 36 kept, 0% served by the adapter**. We say that. We do not wait for 95% to ship the decision layer.

---

**Source of truth for numbers:** slide 11 in `Open Patch — Night Shift.html` (already refreshed) and this file.  
**Live UI:** `Open-Patch-demo-fight.webm` plus `demo-03` / `demo-04` / `demo-08` / `demo-11` / `demo-12`.  
Prefer **hard cuts, glitch stings, type-on, scale punches, split wipes**. One idea per beat. VO is close, urgent, male or low female, 140–155 wpm, no smile in the first 40 seconds.

---

## Do not say

We patched php2shell. Adapter Passed. 33.3% is a win. The Python 50% card is ours. Unsure means verified. Try-models 401 means we beat OpenAI.

---

## Reel (10 beats)

### BEAT 01 · 0:00–0:18 · COLD OPEN
**Picture:** Black. Red emergency wash. Thin siren whoop under, then cut. Type slams:

`21 OCT 2026`  
`UNAUTHENTICATED RCE`  
`CVE-2026-109618` · `CVE-2026-109619`  
`CVSS 9.2`

Then: `php2shell` in 140pt. Sub: `THE ENGINE. NOT YOUR APP.`

**VO:** Twenty-first of October. Unauthenticated remote code execution inside PHP itself. Hackers do not need Invoice.php. They need a box that still speaks seven-four.

**SFX:** Distant siren. Hard mute on the cut to the CVE numbers.

### BEAT 02 · 0:18–0:38 · THE COST
**Picture:** Slide 2 numbers slam in as stamps: `8.2.35 / 8.3.36 / 8.4.27 / 8.5.12`. Stamp `NO OFFICIAL FIX` over `8.1 AND OLDER`. CISA line types on. Then a counter: abandoned runtimes, IoT that never updates.

**VO:** Official patches only on four lines. Eight-one and older are abandoned. CISA said inventory, patch, or take them offline. Your Composer scan will not see this. The lock on the building changed. Redecorating the office does nothing.

### BEAT 03 · 0:38–0:58 · THE WRONG FIX
**Picture:** Split. Left: chat cursor rewriting `Invoice.php`. Right: `FROM php:7.4-apache` frozen, red pulse on `7.4`. Wipe: `FINDING ≠ LEGAL PLAN`.

**VO:** Paste the CVE into a frontier chat. It sanitizes the calculator and calls it fixed. The Dockerfile is still seven-four. Source is not the interpreter.

### BEAT 04 · 0:58–1:16 · THE BILL
**Picture:** Slide 4 chart punches: year budget gone by April. `$1,500 / employee / tool`. `$1,200` for one two-hour session.

**VO:** Company A burned a year of AI coding budget in four months repeating chats that forget last week. Then they capped fifteen hundred dollars a head, a tool, a month. That is what eighty repos of this ticket looks like.

### BEAT 05 · 1:16–1:32 · LOGO HIT (LAUNCH)
**Picture:** Ember radial. Wordmark **OPEN PATCH** slams. Tag: `THE SYSTEM THAT DECIDES WHICH MIGRATION IS LEGAL.` Super: `MUBIT NIGHT SHIFT · LONDON`. Three chips fly in: Decide · Sapling · Mubit.

**VO:** Night Shift, London. Five hundred teams. Every call through Mubit. Open Patch. Read the pins. Say affected. Same frozen task. Move only files that exist. Sapling scores the claim. A human note is the next example. Repo eighty does not pay frontier again.

### BEAT 06 · 1:32–1:58 · LIVE FIGHT
**Picture:** Cut to `Open-Patch-demo-fight.webm` at the A/B reveal, or hold `demo-03-fight-split.png` with a left/right push. Lower thirds:

`PLAIN LUNA · GUESSED 8.4 · NO PINS`  
`OPEN PATCH · HOUSE 8.2 · FOUR PINS`

**VO:** Same model. Two routes. Two real request IDs. Left guessed eight-four and named no pins. Right named Docker, Composer, CI, the version file. Harbor is affected at seven-four. Nineteen seconds on the clock.

### BEAT 07 · 1:58–2:12 · REFEREE
**Picture:** `demo-04-fight-sapling.png`. Bars grow. Left **VIOLATION ~45%**. Right **SUPPORTED 56%**. Both: `CALIBRATED: UNSURE` stays lit. Do not fade it.

**VO:** Banyan Sapling. Violation versus supported. Unsure stays on screen. We do not turn that into a pass.

### BEAT 08 · 2:12–2:26 · THE PATCH
**Picture:** `demo-08` then `demo-09`. Hunks only: Dockerfile, composer, `.php-version`, CI. Strike through any hint of Invoice.php. Title: `chore(runtime): 7.4 → 8.2`.

**VO:** Four locks moved. Application source untouched. The next deploy can run a PHP that already has the fix.

### BEAT 09 · 2:26–2:42 · HONEST CONSOLE
**Picture:** Slide 11 as refreshed, or `demo-11` + `demo-12`. Super:

`PLAN 3 · SILENT TEST · NOT PASSED`  
`102 CALLS · 36 KEPT · 33.3% / 95%`  
`STILL SERVED BY gpt-6-luna`

**VO:** One frozen Mubit task. One hundred and two calls. Thirty-six kept. Adapter v1 is on Silent test: thirty-three percent of a ninety-five exam. That is not Passed. We did not hide it. The cheap specialist is the loop after the legal plan.

### BEAT 10 · 2:42–2:50 · END CARD
**Picture:** Ember field.  
`ONE TASK. 500 REPOS. TEAM RULES. CLAIM SCORED. HUMAN MERGES.`  
`github.com/Ahamisi/open-patch`  
`ASK US TO RUN IT.`

**VO:** Ask us to run it.

---

## Edit grammar

- Cuts on the word, not after it.
- Type-on 2–4 frames per character for stamps; never a paragraph fade.
- Siren only in beat 01, then gone.
- Demo UI can be slightly zoomed 105% with a slow push — one push, not a tour.
- If you must drop time: keep 01, 03, 06, 07, 09, 10.

## Voiceover full (read as one take if you prefer)

Twenty-first of October. Unauthenticated remote code execution inside PHP itself. Hackers do not need Invoice.php. They need a box that still speaks seven-four.

Official patches only on four lines. Eight-one and older are abandoned. CISA said inventory, patch, or take them offline. Your Composer scan will not see this.

Paste the CVE into a frontier chat. It sanitizes the calculator and calls it fixed. The Dockerfile is still seven-four.

Company A burned a year of AI coding budget in four months. Then a fifteen-hundred-dollar cap per head, per tool.

Night Shift, London. Five hundred teams. Every call through Mubit. Open Patch. Read the pins. Say affected. Same frozen task. Move only files that exist. Sapling scores the claim. A human note is the next example.

Same model. Two routes. Left guessed eight-four and named no pins. Right named the four locks. House rule: eight-two.

Sapling: violation versus supported. Unsure stays on screen.

Four files moved. Invoice.php untouched.

Plan three. One hundred and two calls. Thirty-six kept. Silent test. Not Passed. We did not hide it.

Ask us to run it. github.com/Ahamisi/open-patch
