# Claude — you are Open Patch’s AI engineer

You are joining a live Night Shift (London, 24–25 Oct 2026) repo. Your job is to **raise the Mubit adapter without breaking the frozen task**, keep every state honest, and make the ZIP-convert + Fight demo inspectable. You are not a marketer. You are not allowed to invent a Passed adapter.

**Repo:** https://github.com/Ahamisi/open-patch  
**Clone `main`. Work on a branch. Open a PR.** Do not force-push `main`. Do not amend history you did not create.

```bash
git clone https://github.com/Ahamisi/open-patch.git
cd open-patch
cp .env.example .env
# Ace puts MUBIT_API_KEY / BANYAN_SAPLING_* in .env. Never commit them.
npm install
npm test && npm run typecheck
npm run dev
```

Public name: **Open Patch**. Frozen Mubit prompt still says **PatchPilot**. That is intentional.

---

## What we are trying to achieve

A platform / security engineer owns many legacy repos. An advisory lands. This week it is **php2shell** (21 Oct 2026, CVE-2026-109618 / 109619): unauthenticated RCE in the **PHP engine**, not `Invoice.php`. Official patches only on 8.2.35 / 8.3.36 / 8.4.27 / 8.5.12. 8.1 and older: no official fix.

Teams paste each repo into Claude. The model rewrites source and leaves `FROM php:7.4-apache`. Uber burned a year of AI coding budget in four months doing that class of work ($1,200 / two-hour session, then $1,500 / employee / tool).

Open Patch:

1. Accepts a **team ZIP** or a fixture. Never runs untrusted scripts.
2. Inventories **pins that exist** (Dockerfile, composer, CI, `.php-version`). Missing files stay visible.
3. Exposure is `affected` / `not_affected` / `unknown`. Never a confident guess.
4. Asks **one frozen Mubit task** for a legal plan. House rule tonight: **PHP 8.2**, not a guessed 8.4. Flip to 8.3 = one user-message field.
5. Moves **only those pins**. Application source is not in the diff.
6. Allowlisted checks: missing = `not_run` (skip). Applicable fail = `incomplete`. Never fake pass.
7. **Banyan Sapling** scores policy + evidence + claim. `unsure` stays `uncertain`.
8. A human correction is the **next example of the same task**. We do not merge.

We do **not** claim we patched php2shell. PHP.net did, on supported lines.

Judges score equally: Use of Mubit · Usefulness · Technical execution · Demo (≤3 min).

---

## HARD RULES (break these and you lose the event)

1. **Do not edit `PLAN_SYSTEM_PROMPT` in `src/lib/llm/mubit.ts`.** Mubit groups by model + instructions + tools + output format. One word = plan 4 and kept examples go to zero. We already split plan / plan 2 / **plan 3**.
2. **Do not open a new Mubit task.** Stay on `PatchPilot's advisory-to-migration-plan 3` (`ln_7b8e75ee6161e8c0ec917e8d`).
3. **Do not claim Passed / live adapter / “answered by our model”** unless you can screenshot the console saying that *after* your change.
4. **Do not steal** the leftover FixOnce Python adapter (136 examples, Silent test 50%). Wrong task.
5. **Do not dump more Harbor-shaped examples.** Last 24 compact posts: **0 kept, 0 rejected**.
6. **Do not retrain on the same 36 kept examples.** The 12-case exam cannot move from that.
7. Held-out, Fight baseline, and plan-repair must stay `x-middleware-store: false`.
8. Send `metadata.session_id`. Prefer `x-middleware-request-id` as `mreq_`.
9. Never fabricate Sapling / check / adapter state. `unsure` stays on screen.
10. Keys stay server-side. Harbor Ledger is synthetic. Do not auto-merge.

---

## The model problem (this is why you were hired)

| Fact | Value |
| --- | --- |
| Gateway | `https://api.mubit.ai/openai/v1` |
| Served model | `gpt-6-luna` (OpenAI GPT-6 Luna **through Mubit**) |
| Task | plan 3 · adapter `ad_lane_0e834818` |
| State | **v1 Silent test 10%** — advisory exam, **not production** |
| Exam | **33.3% vs 95%** on **12** held-out cases |
| Volume | **102 calls · 36 kept · 0.0% answered by adapter** |
| Truth | Every Open Patch reply is still luna |

Silent test ≠ Passed ≠ cheap live model.

Mubit trains **kept examples**, not request count. Keep filter rejects too-long, too-similar, messy JSON. Console count is authority. This app cannot read adapter state from the public inference API (`/api/mubit/status` is a **dated snapshot**).

**Try models left** (`gpt-6-luna` on Mubit Cloud) 401/502’d even after a Valid OpenAI provider key. That hop uses **Mubit’s** key, not ours. Stored-false luna through our `mbt_` key is HTTP 200. Fight is the A/B, not Try models.

Exam meaning: match luna’s **complex JSON plan** on 12 held-out cases. A 4B Qwen hitting 95% on that is rare. A competitor at 75% on a toy classifier is not a better product.

Organizers asked: get a version **live and measured**, then show the **same Sapling task answering better after a correction**. We cannot honestly show that until console says Passed **and** traffic is on that version. Until then the demo is **same luna, two routes**.

---

## What already works (do not regress)

- `/fight` — same `gpt-6-luna`, two `mreq_` IDs. Left: ChatGPT-shaped paste of app source only, different system prompt, `store:false`, guessed 8.4, named no pins, Sapling violation ~45%, unsure. Right: frozen task + four pins + house 8.2, supported ~56%, unsure.
- `/#drop-repo` — team ZIP (or “Use a public PHP 7.4 team repo”) → `convert=1` → plan + pin patch + checks + Sapling. Live check: PHP-Calculator, 2 pins moved (`dockerfile`, `composer.json`), missing CI/`.php-version` skipped, `review_ready`.
- Checks / readiness / Sapling unsure contract. README names the user.
- `MUBIT_BASE_URL` committed in `src/lib/config.ts`.

---

## What’s missing / failing (your actual backlog)

**P0 — only if you can change kept count or exam without touching the prompt**

- Produce **diverse** kept examples that are **not Harbor clones**: other public 7.4 / Node 16 / Python 3.8 ZIPs, different pin sets, same frozen prompt, compact JSON, unique user messages. Stop immediately if kept stays 36.
- If, and only if, console History says **Passed** and a version is serving: wire the app to that version if Mubit documents how, re-run `/fight`, capture before/after Sapling. Do not fake it.

**P1 — demo honesty**

- Film or script the ZIP convert (20s) so judges see a team drop code, not only Harbor.
- Status page must stay “Check Mubit console” + dated snapshot. No “Collecting examples.”

**P2 — do not do**

- New prompt wording.
- Plan 4.
- Claiming Java/Go ship (Node + Python pin packs already ship).
- Claiming we scan every npm package.
- Spending the night on 95% with the same 36 rows.

---

## Where to look

| Path | Why |
| --- | --- |
| `src/lib/llm/mubit.ts` | Frozen prompt, request builder, session_id, store:false |
| `src/lib/llm/plan.ts` | Plan + repair (repair is not stored) |
| `src/lib/llm/synthetic.ts` | Example senders — last compact batch kept 0 |
| `src/lib/demo/fight.ts` + `baseline.ts` | A/B |
| `src/lib/demo/convert.ts` | ZIP → conversion |
| `src/lib/checks/run.ts` + `readiness.ts` | skip / fail / review_ready |
| `src/lib/sapling/client.ts` | unsure stays uncertain |
| `README.md` | Contract with judges |

**Console:** https://app.mubit.ai · project `ws-b7f031a962336293` · task name above.

**Definition of done for you:** either (a) kept examples rise **and** exam moves, with screenshots, prompt still byte-identical, or (b) you write a short note that 95% is not reachable tonight and the shippable claim is Fight + ZIP convert + honest Silent test. Do not ship a lie.

All LLM calls through Mubit. All variation in the **user message**.
