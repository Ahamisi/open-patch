# Fable brief — motion graphics director, not a carousel

You are a **motion graphics director** cutting a **product launch film for a judging room**, 16:9, max **2:50**. Dark `#07080b`, ember `#f5a524`. IBM Plex / Space Grotesk. No stock brains. No Ken Burns over a bullet list. No “story time” cards that sit still for eight seconds.

This is **not** a generic startup reel. The audience is **Mubit Night Shift, London, 24–25 Oct 2026**. ~500 teams. Official page: https://luma.com/nightshift-london. Every project **must** route app LLM calls through Mubit. Judges score four things equally:

1. **Use of Mubit** — a real task, real `mreq_` IDs, a correction that can become a kept example. Not “we called an API.”
2. **Usefulness** — a job **every engineering team** already has: a platform or security engineer, many repos, a new advisory every week. PHP tonight. Node, Python, lockfiles, base images, abandoned packages tomorrow.
3. **Technical execution** — inventory → plan → patch pins → checks → Sapling. No fake states.
4. **Demo** — live, under 3 minutes, inspectable.

**Why we built Open Patch:** php2shell (21 Oct) is in the PHP *engine*, not app source. Teams will paste each repo into Claude. Uber already blew a year of AI coding budget in four months doing that class of work. Scanners find the CVE or the dirty image. Editors rewrite the tree. Nobody decides the *legal* migration, scores the claim, or trains **one** task so repo eighty does not pay frontier again. That is the gap. We are not another Snyk, OpenHands, or Aider.

**What “use of Mubit” looks like on screen:** frozen task `PatchPilot's advisory-to-migration-plan 3`, two live request IDs, left route `store:false` so it cannot train, right route stored on plan 3, console 102 / 36 / Silent test 33.3%. Honest. Not Passed. Still luna until a version passes.

---

## How the audio must feel

This is the part last cuts got wrong. The picture can slam. **The voice cannot.**

You are a tired staff engineer talking to a VP in a quiet room. Not a trailer. Not a newsreader. Not a shopping list of CVEs.

- Contractions. “don’t”, “it’s”, “that’s”, “we’re”.
- Varied length. One short punch, then a longer human sentence.
- Pause after the idea, not after every noun.
- Say **“PHP 7.4”**, not “seven-four”. Say **“October twenty-first”**, not a timestamp.
- Do **not** read the six product steps as a grocery list.
- Do **not** smile in the first 40 seconds. After the logo you can sound like someone who built a tool, not a siren.
- 135–145 wpm. Close mic. Dry. Almost conversational.
- If a line sounds like a slide title, rewrite it before you record.

The **full take at the bottom** is the performance script. Beat VOs are the same words, split for picture. Do not invent a colder read.

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

## PHP is this week. The product is every pin.

If the film only talks about PHP, judges hear a one-off CVE demo. That is not the product.

**Every engineering team already has this job.** A platform or security engineer. A graveyard of repos. A new advisory on a Monday. The pin is sometimes an interpreter (`php:7.4`, `node:16`, `python:3.8`). Sometimes it is a **lockfile**, a **base image**, a **CI matrix**, an **abandoned Composer or npm package**, an OpenSSL, a Log4j-class library. Hundreds of those tickets a year. Same decision every time: what are we allowed to move, under our house rule, and did anyone score the claim.

Open Patch language packs **already ship** for PHP, Node, and Python pins. Java and Go are the same contract next — do not say they ship tonight. Do not say we scanned the whole ecosystem. Say: **one frozen task, any pin-shaped advisory, repo eighty is cheaper than repo one.**

Harbor Ledger is only the reliable demo (synthetic municipal invoice app, still on PHP 7.4). House rule tonight: **upgrade to 8.2**, the smallest supported patched line — not a blind jump to 8.4/8.5.

What the product actually does, in order (picture, not VO):

1. **Intake** a ZIP or fixture. Never run untrusted repo scripts.
2. **Inventory pins that exist.** Missing files are visible, not faked.
3. **Exposure** is deterministic: `affected` / `not_affected` / `unknown`. Harbor is **affected at 7.4**.
4. **Same frozen Mubit task every time** (`PatchPilot's advisory-to-migration-plan 3`). Model `gpt-6-luna`, same system prompt, `json_object`. Repo, advisory, evidence, reviewer notes live **only** in the user message.
5. **Patch only pins that exist.** Dockerfile, composer, `.php-version`, CI → **8.2**. `Invoice.php` is **not** in the diff.
6. **Allowlisted checks.** Skip missing. Never fake a pass.
7. **Banyan Sapling** scores a specific claim. Unsure stays on screen.
8. **Human correction** is the next example of that **same** task.

**The knockout demo (already recorded):** same `gpt-6-luna`, two routes, two real `mreq_` IDs, ~19.5 s.

| | Plain frontier (ChatGPT-shaped paste) | Open Patch |
| --- | --- | --- |
| Input | Advisory + Invoice.php. No policy. `store:false` | Frozen task + four pins + house 8.2 |
| It did | Knew source cannot patch the engine. Guessed **8.4**. Named **no pins** | Named Docker, Composer, CI, `.php-version`. Moved them to **8.2** |
| Sapling raw | **violation ~45%** | **supported 56%** |
| Calibrated | **unsure** (shown) | **unsure** (shown) |

That is the product: **decide, constrain, verify, teach.** The cheap Mubit adapter is the *loop after* the legal plan. Tonight it is **Silent test 33.3% / 95%, 102 calls, 36 kept, 0% served by the adapter**. We say that.

---

## Use cases (every engineering team)

Three jobs they already have. We make them faster because the **house rule is an input**, not a hope.

1. **Code review** — Stop arguing “just take 8.4” in every PR. The reviewer already wrote the line. That note is the next plan.
2. **Migration** — One advisory, many repos. PHP tonight. Node 16 and Python 3.8 packs already ship. Tomorrow a lockfile, a base image, an abandoned package.
3. **Patching** — Move only pins that exist. Checks do not fake pass. Unsure stays. A human still merges.

## How they tap in (already in the app)

1. Attach **SEC-RUNTIME-01** or their own policy. Tonight 8.2. Flip to 8.3 = one field in the user message.
2. ZIP or fixture. Scripts, Composer hooks, and CI never run.
3. Frozen Mubit task plans against **that** policy. Only files that exist move.
4. Sapling scores the claim. A correction is the next example. They merge.

Snyk still finds. Their editor still edits. We are the missing middle.

## Pricing (proposed — say that out loud)

Not a Stripe page tonight. Contrast is real; the SKUs are the pitch.

| | Number |
| --- | --- |
| Frontier today | **$1,200** / two-hour session. Then **$1,500 / employee / tool**. |
| Night Shift partner | **$0** — prove it on their house rule. |
| Team | **$499 / month** — 1 policy, 50 repos, review + migrate + patch. |
| Platform | **$1,999 / month** — many policies, 500 repos. Repo 80 is the same invoice. |

Do **not** sell another per-head copilot. One decision layer. Their rules.

---

**Source of truth for numbers:** slide 11 in `Open Patch — Night Shift.html` (already refreshed) and this file.
**Live UI:** `Open-Patch-demo-fight.webm` plus `demo-03` / `demo-04` / `demo-06` / `demo-09` / `demo-10` / `demo-11`.
Prefer **hard cuts, glitch stings, type-on, scale punches, split wipes**. One idea per beat.

---

## Do not say

We patched php2shell. Adapter Passed. 33.3% is a win. The Python 50% card is ours. Unsure means verified. Try-models 401 means we beat OpenAI. We already scan every npm package. Java and Go ship tonight.

---

## Reel (11 beats)

### BEAT 01 · 0:00–0:16 · COLD OPEN
**Picture:** Black. Red emergency wash. Thin siren whoop under, then cut. Type slams:

`21 OCT 2026`
`UNAUTHENTICATED RCE`
`CVE-2026-109618` · `CVE-2026-109619`
`CVSS 9.2`

Then: `php2shell` in 140pt. Sub: `THE ENGINE. NOT YOUR APP.`

**VO:** This landed on October twenty-first. Remote code execution inside PHP itself. Not a bug in your invoice app. Just a box still running 7.4.

**SFX:** Distant siren. Hard mute on the cut to the CVE numbers.

### BEAT 02 · 0:16–0:32 · THE COST
**Picture:** Slide 2 numbers slam in as stamps: `8.2.35 / 8.3.36 / 8.4.27 / 8.5.12`. Stamp `NO OFFICIAL FIX` over `8.1 AND OLDER`. CISA line types on.

**VO:** Patches exist on four lines. 8.1 and older? Nobody’s coming. CISA said find them, patch them, or take them offline. Your Composer scan will not see this.

### BEAT 03 · 0:32–0:48 · THE WRONG FIX
**Picture:** Split. Left: chat cursor rewriting `Invoice.php`. Right: `FROM php:7.4-apache` frozen, red pulse on `7.4`. Wipe: `FINDING ≠ LEGAL PLAN`.

**VO:** So people paste the CVE into a chat. The model rewrites the calculator and says you’re fine. The Dockerfile is still 7.4. Source is not the interpreter.

### BEAT 04 · 0:48–1:02 · THE BILL
**Picture:** Slide 4 chart punches: year budget gone by April. `$1,500 / employee / tool`. `$1,200` for one two-hour session.

**VO:** A company everyone knows burned a year of AI coding budget in four months doing that, repo after repo. Then they capped fifteen hundred dollars a head. That’s what this ticket costs when you have eighty services.

### BEAT 05 · 1:02–1:16 · LOGO HIT
**Picture:** Ember radial. Wordmark **OPEN PATCH** slams. Tag: `THE SYSTEM THAT DECIDES WHICH MIGRATION IS LEGAL.` Super: `MUBIT NIGHT SHIFT · LONDON`.

**VO:** We’re at Night Shift in London. Five hundred teams. Every call through Mubit. This is Open Patch.

### BEAT 06 · 1:16–1:40 · EVERY TEAM + HOW THEY BUY
**Picture:** HTML slides 7–9, or a storm of stamps then three cards:

`REVIEW` · `MIGRATE` · `PATCH`
Then: `$1,200 / SESSION` crossed out. `$499 / TEAM` slams. Sub: `YOUR RULES. ONE INVOICE.`

`PHP 7.4` · `NODE 16` · `PYTHON 3.8` · `npm` · `OpenSSL` stay as texture, not the headline.

**VO:** PHP is this week’s fire. Tomorrow it’s Node, Python, a leftover OpenSSL, an abandoned npm lock. Review, migrate, patch — against the rules you already wrote. Not another fifteen hundred dollars a head. Four ninety-nine a team. Repo eighty is the same invoice.

### BEAT 06b · after every-team · TEAM UPLOAD
**Picture:** Home `#drop-repo`. A ZIP lands. Button: `CONVERT THIS ZIP`. Cut to hunks: Dockerfile / composer / CI only. Strike Invoice.php.

**VO:** A team drops their ZIP. We do not rewrite their invoices. We convert the locks their house rule allows.

### BEAT 07 · 1:40–1:56 · LIVE FIGHT
**Picture:** Cut to `Open-Patch-demo-fight.webm` at the A/B reveal, or hold `demo-03-fight-split.png` with a left/right push. Lower thirds:

`PLAIN LUNA · GUESSED 8.4 · NO PINS`
`OPEN PATCH · HOUSE 8.2 · FOUR PINS`

**VO:** Same model. Two routes. Two real request IDs. Left guessed 8.4 and named nothing. Right named Docker, Composer, CI, the version file. Harbor is affected at 7.4. Nineteen seconds.

### BEAT 08 · 1:56–2:08 · REFEREE
**Picture:** `demo-04-fight-sapling.png`. Bars grow. Left **VIOLATION ~45%**. Right **SUPPORTED 56%**. Both: `CALIBRATED: UNSURE` stays lit. Do not fade it.

**VO:** Sapling called one a violation and the other supported. Both came back unsure. We left that on screen. We don’t turn unsure into a pass.

### BEAT 09 · 2:08–2:20 · THE PATCH
**Picture:** `demo-09-patch-hunks.png`. Hunks only: Dockerfile, composer, `.php-version`, CI. Strike through any hint of Invoice.php. Title: `chore(runtime): 7.4 → 8.2`.

**VO:** Four locks moved. App source didn’t. Next deploy can run a PHP that already has the fix.

### BEAT 10 · 2:20–2:38 · HONEST CONSOLE
**Picture:** Slide 11 as refreshed, or `demo-11`. Super:

`PLAN 3 · SILENT TEST · NOT PASSED`
`102 CALLS · 36 KEPT · 33.3% / 95%`
`STILL SERVED BY gpt-6-luna`

**VO:** One frozen Mubit task. A hundred and two calls, thirty-six kept. The adapter is on Silent test — thirty-three percent of a ninety-five exam. That’s not Passed. We’re not hiding it. The cheap specialist is the loop after the legal plan.

### BEAT 11 · 2:38–2:50 · END CARD
**Picture:** Ember field.
`PHP TONIGHT. EVERY PIN TOMORROW.`
`ONE TASK. YOUR HOUSE RULE. HUMAN MERGES.`
`github.com/Ahamisi/open-patch`
`ASK US TO RUN IT.`

**VO:** If you own more than one repo, this is your week. Ask us to run it.

---

## Edit grammar

- Cuts on the word, not after it.
- Type-on 2–4 frames per character for stamps; never a paragraph fade.
- Siren only in beat 01, then gone.
- Demo UI can be slightly zoomed 105% with a slow push — one push, not a tour.
- Beat 06 (every team) is **not optional**. If you must drop time: keep 01, 03, 06, 07, 08, 10, 11.

## Voiceover full (one take — this is what you record)

This landed on October twenty-first. Remote code execution inside PHP itself. Not a bug in your invoice app. Just a box still running 7.4.

Patches exist on four lines. 8.1 and older? Nobody’s coming. CISA said find them, patch them, or take them offline. Your Composer scan will not see this.

So people paste the CVE into a chat. The model rewrites the calculator and says you’re fine. The Dockerfile is still 7.4. Source is not the interpreter.

A company everyone knows burned a year of AI coding budget in four months doing that, repo after repo. Then they capped fifteen hundred dollars a head. That’s what this ticket costs when you have eighty services.

We’re at Night Shift in London. Five hundred teams. Every call through Mubit. This is Open Patch.

PHP is this week’s fire. Tomorrow it’s Node, Python, a leftover OpenSSL, an abandoned npm lock. Review, migrate, patch — against the rules you already wrote. A team drops their ZIP. We do not rewrite their invoices. We convert the locks their house rule allows. Not another fifteen hundred dollars a head. Four ninety-nine a team. Repo eighty is the same invoice.

Same model. Two routes. Two real request IDs. Left guessed 8.4 and named nothing. Right named Docker, Composer, CI, the version file. Harbor is affected at 7.4. Nineteen seconds.

Sapling called one a violation and the other supported. Both came back unsure. We left that on screen. We don’t turn unsure into a pass.

Four locks moved. App source didn’t. Next deploy can run a PHP that already has the fix.

One frozen Mubit task. A hundred and two calls, thirty-six kept. The adapter is on Silent test — thirty-three percent of a ninety-five exam. That’s not Passed. We’re not hiding it. The cheap specialist is the loop after the legal plan.

If you own more than one repo, this is your week. Ask us to run it.
