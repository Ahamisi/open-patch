# Open Patch — video kit for an LLM / editor

Upload **this file + the media listed below**. Do not invent UI, scores, or a Passed adapter. Cut to the stills and the live webm. Max **3:00**. 16:9. Dark. No stock AI-brain art.

**Product:** Open Patch  
**Repo:** https://github.com/Ahamisi/open-patch  
**Live app (local):** http://127.0.0.1:3000/fight  
**Mubit task:** PatchPilot's advisory-to-migration-plan 3  
**Date:** 24 Oct 2026, London

---

## Upload these files (and only these)

| File | Use |
| --- | --- |
| `Open-Patch-demo-fight.webm` | **Master tape.** 1:04. Live Fight A/B then Harbor Evidence → Plan → Patch → Verify. Prefer this over the morning `.mov` files. |
| `demo-01-home.png` | Title / product |
| `demo-02-fight-landing.png` | “Same model. Two routes.” |
| `demo-03-fight-split.png` | **Money shot.** Plain frontier vs Open Patch |
| `demo-04-fight-sapling.png` | Sapling bars: violation vs supported |
| `demo-05-evidence.png` | Harbor affected, PHP 7.4 |
| `demo-06-evidence-pins.png` | Four 7.4 pins |
| `demo-07-plan.png` | Frozen task plan + `mreq_` |
| `demo-08-patch.png` | PR: 7.4 → 8.2, source unchanged |
| `demo-09-patch-hunks.png` | Dockerfile / composer hunks |
| `demo-10-verify.png` | Sapling on the legal claim, unsure stays |
| `demo-11-console-task.png` | plan 3 · 102 calls · 36 kept · Silent test |
| `demo-12-console-adapters.png` | v1 33.3% / 95%. Do **not** crop. Do **not** use the Python 50% card as ours. |

Optional B-roll only if the master tape is unusable: `Open-Patch-demo-harbor-walk.webm` (no Fight split). Ignore `demo-raw/`, morning `.mov` files, and `Screenshot 2026-10-24 at *.png` unless you need a fallback.

---

## Facts you may put on screen (do not change)

**php2shell (this week)**  
CVE-2026-109618 · CVE-2026-109619 · CVSS 9.2 · 21 Oct 2026  
Unauthenticated RCE in the PHP **engine**, not in app source.  
Patched only on **8.2.35 · 8.3.36 · 8.4.27 · 8.5.12**. PHP 8.1 and older: no official fix.  
PHP.net: can fire **before any application code** (highest risk: mod_php).  
CISA (updated 23 Oct): inventory, patch, or take unsupported installs offline.  
Composer / code scan will not list the interpreter.

**This live Fight (in the webm)**  
Harbor Ledger **affected at 7.4** · wall clock **19526 ms**  
Pins moved: Dockerfile, composer.json, .php-version, `.github/workflows/ci.yml`  
Left / plain luna: guessed **PHP 8.4**, named no pins · Sapling raw **violation ~45%** · calibrated **unsure**  
Right / Open Patch: **8.2 or 8.3**, named the pins · Sapling raw **supported 56%** · calibrated **unsure**  
Legal request id: `mreq_01a16eb4a22177d283b6423c78a4edc2`  
Invoice.php is **not** in the patch.

**Mubit console (honest)**  
plan 3 · v1 · **Silent test 10%** · exam **33.3% / 95%** · **102 calls · 36 kept** · **0.0% answered by our model**  
Not Passed. Not live. Not a cheap specialist in production.  
Every Open Patch reply tonight is still **gpt-6-luna**.

**Cost line**  
Uber burned its **2026 AI coding budget in four months**, then capped **$1,500 / employee / tool**.

---

## Do not say (hard)

- We patched php2shell. (PHP.net did.)
- The adapter Passed. (It is Silent test.)
- 33.3% is a win, or “almost 95%.”
- The Python 50% row is ours.
- Try models 401 means we beat OpenAI / luna is down.
- Unsure means verified.
- Anthropic is a subscriber.
- We rewrote Harbor PHP source to 8.4.

---

## Spoken script (read this; ~2:40)

**0:00–0:20 · Title + fire**  
Open Patch. We decide which migration is legal.  
This week php2shell landed in the PHP engine, not in Invoice.php. Fixes only on 8.2.35, 8.3.36, 8.4.27, 8.5.12. Eight-one and older have no official patch. CISA said inventory, patch, or take them offline.

**0:20–0:50 · Fight landing → run**  
Same model. Two routes. Left is gpt-6-luna as a normal engineer: advisory plus source, no policy, not stored. Right is the same model on our frozen Open Patch task. Both request IDs are real.

**0:50–1:30 · Split + Sapling**  
Harbor is affected at 7.4.  
Left guessed 8.4 and named no pins. Banyan Sapling: violation, about 45 percent. Calibrated status: unsure.  
Right named Docker, Composer, CI, and the version file. House rule: 8.2, not a guessed 8.4. Sapling: supported, 56 percent. Unsure stays on screen. We do not turn that into a pass.

**1:30–2:10 · Evidence, plan, patch**  
Four locks, all 7.4. We move the locks. We do not rewrite Invoice.php. The proposed patch is chore, runtime, Harbor Ledger, PHP 7.4 to PHP 8.2. Application source left unchanged.

**2:10–2:40 · Console**  
This is the Mubit task: PatchPilot advisory-to-migration-plan 3. One hundred and two calls. Thirty-six kept. Adapter v1 is on Silent test, 33.3 percent of a 95 percent exam. That is not Passed. We did not hide it. The cheap specialist is the loop after the legal plan, not tonight’s claim.

**2:40–3:00 · Close**  
Uber blew a year of AI coding budget in four months repeating frontier chats. One skill. Team rules in the user message. Claim scored. Human merges. Ask us to run it. github.com/Ahamisi/open-patch

---

## Edit order (if you rebuild from stills)

1. Black card: **Open Patch** / The system that decides which migration is legal  
2. `demo-02-fight-landing.png`  
3. Cut into `Open-Patch-demo-fight.webm` from the A/B reveal through Sapling  
4. Hold `demo-03-fight-split.png` and `demo-04-fight-sapling.png` 3s each if the webm moves too fast  
5. `demo-05` → `demo-06` → `demo-07` → `demo-08` → `demo-09` → `demo-10`  
6. `demo-11-console-task.png` then `demo-12-console-adapters.png` (keep both adapter cards; say the **right** card is ours, 33.3%)  
7. End card: repo URL + “Ask us to run it.”

Lower-third captions, if any: `Plain frontier · violation ~45% · unsure` and `Open Patch · supported 56% · unsure`.

---

## Voice / look

Dark background `#07080b`. Ember accent. IBM Plex if you overlay type. One idea per card. No music that drowns the IDs. No “we beat Claude” title.

If you must shorten: keep Fight split + patch hunks + console 102/36. Drop home and plan if needed.
