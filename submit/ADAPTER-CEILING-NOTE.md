# Adapter note: 95% isn't reachable tonight

Written 24 Oct 2026, 20:30 London, by the Claude engineer, after reading the live console and the Mubit docs. Nothing was sent to Mubit for this note. `PLAN_SYSTEM_PROMPT` has not changed (sha256 of the declaration block is `14a014ae0fb413e34e0d399177903f79aeb23a8cba50f2214d5b3a19a537ae3e`, the same as at `1013bcf`).

## What we ship

**Fight A/B + ZIP convert + an honest Silent test.** The adapter is not Passed and nothing in Open Patch is served by it. Every reply comes from `gpt-6-luna` through Mubit.

## Console, 24 Oct ~20:25 London (task `ln_7b8e75ee6161e8c0ec917e8d`, adapter `ad_lane_0e834818`)

| Fact | Value |
| --- | --- |
| Calls / kept | **103 / 44** at 20:25; **660 / 44** at 22:45 after the 500-repo fleet run (the brief said 102 / 36) |
| Version | v1 only, Silent test 10%, "Exam: not passed (advisory)" |
| Exam | adapter **33.3%** · base model + prompt **8.3%** · 12 test cases · needs 95% |
| Live gate | "Live needs 20 judged test cases · this version has 12." |
| Spot checks on real calls | 0 of 1 passed (target 90%) |
| Answered by our model (7 days) | 0.0% |
| Routed requests (24 h, project) | 0.0% |

The reviewer log explains the move from 36 to 44. The compact batches sent around 14:00–15:00 showed "0 kept" when they arrived. About two hours ago the reviewer judged them: **8 kept, 8 rejected**. So the compact shape isn't dead; the reviewer was just late. Training v1 took about six hours after its 36 were kept, and v1 was trained before these 8 arrived. **No v2 exists yet.**

## Why 95% isn't reachable tonight

1. **The grader is close to string-level.** I read all 12 held-out rows. Row 10 fails even though both answers have `actions: []`, the same verdict and one similar verification step. Row 12 fails because of one extra `missingInformation` line. Rows 1 and 4 fail on invented detail: "7.3.33" where the evidence said 7.3, and `ci/config.php`, a file that doesn't exist. Getting a 4B Qwen to match 95% of luna's free-text JSON at this level of detail would take far more than 8–20 new rows.
2. **The exam is drawn from the oldest one-line examples.** Every held-out row has `evidenceIds: []` and reads like the plain-string `EXAMPLES` list in `synthetic.ts`, not the production `buildPlanUserMessage` shape. New production-shaped rows teach the inputs that matter, but they don't target these 12.
3. **The time doesn't fit.** Reviewer lag was about 2 h and training about 6 h last time. Then v2 must be graded, needs at least 20 judged test cases to go live, and has to pass at 95%. Nothing sent now can be measured before the demo.
4. **Even Passed wouldn't change `/fight`.** Mubit's docs say a Passed version can be compared in **Try models**. They document no request field that sends app traffic to an adapter: "There is no Mubit model ID." Routing is engine-driven (silent test → canary → promoted). So "re-run Fight and show the adapter answering better" needs a promotion the engine controls, not a code change from us.

## What we can honestly say on stage

- One frozen Mubit task. 103 calls, 44 kept. v1 scores 33.3% where the base model with the same prompt scores 8.3%, so the kept examples taught it something real. It still isn't close to the 95% target, it is not Passed, and luna serves every reply.
- A human correction becomes the next example of the same task. Whether it is kept is the reviewer's call, and the console is the authority.

## If the team wants to keep going after the demo (not tonight)

- Send **production-shaped** cases built by `buildPlanUserMessage` from the 12 real archives in `fixtures/archives/` (Laravel 8/12, Symfony, Slim, Yii2, Cachet, phpoidc, PHP-Calculator, docker-php-sample, Flask 2.0.3, Node getting-started, node-docker-defaults). They should come with real evidence IDs, one session each, and no Harbor.
- Prefer cases where luna's correct answer is short (`not_affected` → `actions: []`, `unknown` → one `investigate`). Those are the rows v1 got almost right and then lost on extra detail.
- Watch the task's "Next: a new version after N new examples" line. Stop if a batch is judged 0 kept.

## Update, 22:45 London

After compacting requests (pins only, under 15 KB) and running 500+ public repos through `/api/fleet/check`, plan 3 shows 660 calls in 7 days and still 44 kept. The task History says "Over today's review limit: N new calls not reviewed" for most of the batch, so the reviewer has not judged them yet. v1 is unchanged: Silent test 10%, 33.3% / 95%, not Passed.
