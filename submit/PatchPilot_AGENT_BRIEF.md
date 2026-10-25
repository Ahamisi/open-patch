# PatchPilot --- Hackathon Build Brief & AI Engineer Instructions

> **Purpose:** This is the single source of truth for the coding agent
> building PatchPilot for Mubit Night Shift. Read this file before
> changing code. Follow the scope, product constraints, integration
> requirements, and acceptance criteria below. Make pragmatic decisions
> and ship a working end-to-end demo.

## 0. Executive brief

**Product:** PatchPilot\
**One-liner:** An AI security-migration engineer that turns a
vulnerability advisory into a repository-specific, tested, reviewable
remediation pull request.

**Target user:** Engineering teams maintaining legacy or long-lived PHP
applications (initially), especially teams that need to respond to
vulnerability disclosures, runtime/dependency end-of-life, and internal
secure-coding requirements without blindly applying broad upgrades.

**Core workflow:** User selects or uploads a demo repository and a
vulnerability/advisory scenario → PatchPilot inventories relevant
runtime/dependency/configuration evidence → identifies likely exposure →
creates a remediation plan → proposes a small patch or configuration
change → runs available checks → verifies claims against policy/evidence
using Banyan Sapling → presents an evidence-backed review report and a
pull-request-ready diff. A human can correct the plan/verdict; that
correction is recorded as an outcome/example and the recurring task is
routed through Mubit so the team can demonstrate the real
learning/adaptation workflow.

**Product principle:** Never claim "fixed" because a model says so. A
fix must be supported by concrete evidence such as a version/config
check, a passing test, a static-analysis result, or a human-approved
review. Uncertainty must remain visible.

**MVP language:** PHP first. Design interfaces so JavaScript/Node can be
added later, but do not attempt broad multi-language support in the
hackathon MVP.

**Autonomy:** Generate patches and run checks; prepare a
pull-request-ready change for human review. Do not automatically merge,
deploy, or modify a real production system.

## 1. Hackathon rubric and how this build earns points

Night Shift judging weights four criteria equally:

1.  **Use of Mubit** --- the demo must show a correction turning into a
    real model update/adaptation, not just an API call.
2.  **Usefulness** --- a real recurring task that an engineering team
    would want handled.
3.  **Technical execution** --- a working product that holds up under
    questions.
4.  **Demo** --- clear, live, and within the time limit.

The event brief says every project must route its LLM calls through
Mubit. The event also says all project code must be written during the
event; open-source libraries and existing personal tooling are
permitted. Treat this document as a plan/spec, not prewritten
application code.

### Rubric evidence we must visibly demonstrate

-   **Mubit:** Show actual requests/tasks in the Mubit console,
    corrections/outcomes recorded, adapter/task status, and a
    before/after comparison if a passing adapted model becomes
    available. Do not fake training or claim a model improved unless a
    measured comparison proves it.
-   **Usefulness:** Show one realistic vulnerability-driven migration on
    a PHP repository, with relevant source/config evidence and an
    actionable diff.
-   **Technical execution:** Demonstrate a complete path from input to
    analysis to evidence-backed result; include test/check output and
    failure states.
-   **Demo:** Use a seeded scenario that works reliably without
    network-dependent surprises. Keep a live path available where
    practical and clearly label seeded/sample artifacts.

Official event page: https://luma.com/nightshift-london\
Mubit docs: https://docs.mubit.ai/\
Mubit first-adapter guide: https://docs.mubit.ai/guides/first-adapter

## 2. Product scope: what to build

### P0 --- must ship

1.  **Repository intake**
    -   MVP supports a bundled demo repository or uploaded ZIP. A GitHub
        URL/import is optional if time allows.
    -   Never execute untrusted repository scripts automatically.
    -   Parse `composer.json`, `composer.lock` when present, PHP version
        declarations, Dockerfile/container tags, CI configuration, and
        selected source files.
    -   Display what was inspected and what could not be inspected.
2.  **Advisory/scenario intake**
    -   Provide a seeded demo scenario with a clear advisory summary,
        affected component/version range, remediation guidance, and
        links/source references.
    -   Allow a user to enter an advisory URL/text or select a built-in
        scenario.
    -   Treat advisory claims as untrusted input until grounded in
        evidence.
    -   Distinguish **runtime/platform vulnerability** from
        **application-code vulnerability**. An application source patch
        cannot fix a vulnerable PHP runtime by itself.
3.  **Exposure analysis**
    -   Compare detected runtime/dependency/configuration evidence
        against the scenario's affected range and remediation
        requirements.
    -   Output `affected`, `not_affected`, or `unknown` with an
        explanation and evidence references.
    -   If runtime version cannot be established, return `unknown`, not
        a confident conclusion.
    -   Use deterministic version/rule checks where possible; use LLMs
        for structured extraction, summarisation, migration planning,
        and code-change reasoning.
4.  **Migration plan and proposed change**
    -   Generate a small, reviewable plan with:
        -   affected asset/component;
        -   reason it may be exposed;
        -   required action (runtime upgrade, dependency upgrade, code
            change, configuration change, or human investigation);
        -   expected risk and compatibility considerations;
        -   exact files likely to change;
        -   tests/checks needed;
        -   rollback notes.
    -   Produce a diff for a safe, seeded example. If a real runtime
        upgrade is needed, propose the version/config change rather than
        pretending a source edit fixes it.
    -   Keep changes minimal and explain each hunk.
5.  **Verification with Banyan Sapling**
    -   Call the supplied Banyan Sapling endpoint from the server, not
        from browser code:
        `https://6adbee0669a00298cd4774c9.endpoints.huggingface.cloud`
    -   Playground/model demo:
        https://huggingface.co/spaces/MubitLabs/banyan-sapling-demo
    -   Read the current model card/API instructions before
        implementation. Do not assume a request/response schema from
        this brief; inspect the model card or playground and implement
        the actual contract.
    -   Feed it a **specific claim**, a concise **policy**, and the
        relevant **evidence**.
    -   Display the actual verdict and scores returned, along with the
        claim/policy/evidence used. Preserve the raw response for
        debugging.
    -   Treat Sapling as an evidence/policy verifier, not a repository
        scanner, code executor, vulnerability database, or proof of
        exploitability.
    -   Its `unsure`/insufficient-evidence outcomes must remain visible.
        Do not force uncertain output into "pass".
    -   Add timeout/error handling. If unavailable, label verification
        as unavailable and fall back to deterministic checks plus human
        review. Never fabricate a Sapling verdict.
6.  **Human correction and outcome capture**
    -   Reviewer can mark a result `correct`, `incorrect`, or
        `needs_more_evidence`, and provide a correction/note.
    -   Save original input, model output, reviewer correction, policy
        version, evidence references, test results, timestamp, and run
        ID.
    -   Make the correction visible in the UI as an audit trail.
    -   Corrections should create examples for the relevant recurring
        task, but do not claim the correction instantly changes the
        model.
7.  **Mubit integration**
    -   Route all application LLM calls through Mubit. Do not call
        OpenAI/Anthropic/Gemini directly from the app for these tasks.
    -   Use the current official Mubit console's Connect page and docs
        to confirm the workspace's exact base URL, SDK/provider support,
        and required key.
    -   For OpenAI-compatible calls, current docs show a pattern like:
        `base_url="https://api.mubit.ai/openai/v1"` and
        `api_key=MUBIT_API_KEY`. Use the exact base URL shown in the
        workspace console if it differs.
    -   Use a stable, consistent task instruction/model/tool/output
        format for calls that should group into one recurring task.
        Avoid changing the system prompt on every call, as Mubit groups
        calls by task-defining fields.
    -   Create varied synthetic examples for the same recurring task
        (e.g. advisory-to-remediation-plan extraction or migration-plan
        classification), while keeping a held-out evaluation set.
    -   Follow Mubit's actual task/adapter state in the console. The
        docs say a task typically needs 25 kept examples to begin its
        first training; the console's count is authoritative. Training
        may not finish during the hackathon.
    -   If the workspace allows it, demonstrate the lifecycle: collect
        examples → task/adapter appears → training/testing status →
        compare passing adapter against provider model. If no adapter
        passes, show the honest status and use a local held-out
        evaluation to report observed performance; do not pretend the
        adapter is active.
    -   Do not use "Try models"/comparison calls as training examples if
        the docs state those calls are not stored.
    -   Keep API keys and provider credentials in server-side
        environment variables only.

### P1 --- only after P0 works

-   GitHub repository import and opening a real pull request via GitHub
    App/OAuth.
-   More advanced dependency vulnerability database integration.
-   JavaScript/Node.js migration pack.
-   Team policy editor and saved policy profiles.
-   Background job queue and multi-repository management.

### Explicitly out of scope

-   Autonomous merge or production deployment.
-   Claims that the product guarantees security.
-   Running arbitrary repository scripts, package lifecycle scripts,
    migrations, or deployment commands without an explicit sandbox and
    user approval.
-   Building a generic chatbot as the main product.
-   Supporting every language/ecosystem at launch.
-   Faking a Mubit adapter, a Sapling result, benchmark numbers, GitHub
    PR, test run, or security finding.

## 3. User experience and core screens

Build a clean developer-focused interface. Prioritise clarity over
visual effects.

### Screen A --- Projects / New scan

-   Name of repository/demo project.
-   Select a seeded repository or upload ZIP.
-   Select/enter advisory scenario.
-   Button: `Analyze repository`.
-   Show a short safety note: repository scripts are not executed during
    scanning.

### Screen B --- Scan results

Show: - Exposure status: `Affected`, `Not affected`, or `Unknown`. -
Severity/urgency from the advisory, clearly attributed to its source. -
Evidence cards: detected PHP/runtime version, package versions, files
inspected, config findings, missing evidence. - Clear distinction
between **confirmed evidence**, **inference**, and **unknown**. -
Button: `Create remediation plan`.

### Screen C --- Remediation plan

Show: - Prioritized actions. - Required upgrade/config/code changes. -
Files to change and why. - Compatibility risks and rollback plan. -
Verification checklist. - Button: `Generate proposed patch`.

### Screen D --- Patch review

Show side-by-side diff or unified diff. - Each change links to the
reason and evidence. - Buttons: `Run checks`, `Mark correct`,
`Request changes`. - Never state checks passed unless they actually ran
and passed. - Show test/check logs and exit codes.

### Screen E --- Verification & learning

Show: - Sapling claim, policy, evidence, actual verdict/scores, and
uncertainty. - Deterministic checks and test results separately from
Sapling's opinion. - Human correction form and audit trail. - Mubit
task/run status, adapter status, and measured before/after results if
available. - If adapter training is pending, show
`Collecting examples`/actual status---not "learned".

## 4. Technical architecture

Use the team's existing stack if already started. If starting fresh,
prefer:

-   Next.js App Router + TypeScript.
-   Tailwind + shadcn/ui for UI.
-   Server-side route handlers for model calls.
-   A small persistent store (SQLite/Prisma or existing database) for
    projects, scans, evidence, plans, verifications, corrections, and
    evaluation runs.
-   Zod for validating all external/model outputs.
-   A small PHP demo repository committed as a fixture.
-   GitHub API only if time allows; otherwise generate a downloadable
    patch/diff and PR-ready summary.

### Suggested module boundaries

-   `lib/repo/`: safe ZIP intake, manifest/config parsing, file
    inventory.
-   `lib/advisories/`: advisory schema, seeded scenario, source
    metadata.
-   `lib/analysis/`: deterministic version/range checks and evidence
    extraction.
-   `lib/llm/`: single Mubit-backed client and stable task prompts.
-   `lib/sapling/`: server-side API client, schema validation,
    timeout/error handling.
-   `lib/patches/`: patch generation, diff display, safe fixture
    application.
-   `lib/checks/`: allowlisted static checks; never execute arbitrary
    repo scripts.
-   `lib/feedback/`: corrections, outcomes, audit records,
    training-example export.
-   `lib/evaluation/`: held-out fixtures, baseline/adapted comparisons,
    metrics.
-   `app/`: pages and route handlers.
-   `fixtures/`: seeded repository, advisory, policy, test cases.

Adapt names to the existing codebase; do not reorganise everything if a
working scaffold exists.

## 5. Data contracts

Use typed schemas and validate every model/API boundary. A reasonable
internal structure:

### `RepositoryEvidence`

-   `id`
-   `path`
-   `kind`:
    `manifest | runtime_config | source | ci | test | advisory | other`
-   `excerpt` (bounded length)
-   `sha256` or stable content fingerprint where feasible
-   `sourceLabel`
-   `confidence`: `confirmed | inferred | missing`
-   `collectedAt`

### `ExposureAssessment`

-   `status`: `affected | not_affected | unknown`
-   `component`
-   `detectedVersion` (nullable)
-   `affectedRange` (nullable)
-   `reason`
-   `evidenceIds[]`
-   `checks[]` with `name`, `status`, `details`, `exitCode?`
-   `limitations[]`

### `RemediationPlan`

-   `summary`
-   `actions[]`: `id`, `type`
    (`runtime_upgrade | dependency_upgrade | code_change | config_change | investigate`),
    `priority`, `description`, `files[]`, `evidenceIds[]`, `risk`,
    `rollback`
-   `verificationSteps[]`
-   `humanApprovalRequired: true`

### `VerificationRecord`

-   `claim`
-   `policy`
-   `evidenceIds[]`
-   `saplingRawResponse` (nullable)
-   `saplingVerdict` (exact value returned; do not invent enum values)
-   `saplingScores` (preserve returned fields)
-   `verificationStatus`:
    `verified | contradicted | uncertain | unavailable`
-   `deterministicChecks[]`
-   `humanReviewStatus`
-   `limitations[]`

### `CorrectionRecord`

-   `runId`
-   `taskName`
-   `originalOutput`
-   `reviewerLabel`: `correct | incorrect | needs_more_evidence`
-   `correctedOutput` or note
-   `evidenceIds[]`
-   `policyVersion`
-   `createdAt`

These are application-level schemas; map the actual Sapling response
into them without discarding the original response. Never make up fields
in the upstream API.

## 6. LLM task design and Mubit strategy

### Recurring task to adapt first

Choose one narrow, repeatable task with a stable input/output shape,
such as:

**`advisory_to_migration_plan`**\
Input: normalized advisory, repository evidence bundle, engineering
policy.\
Output: validated JSON remediation plan with explicit evidence IDs,
actions, missing information, and checks.

A second possible task, only if the first works, is
`patch_review_summary` or `test_failure_triage`.

### Rules for reliable task grouping

-   Use one stable system instruction for the chosen task.
-   Keep the same provider/model and output format where practical.
-   Pass variable content as user input, not by rewriting the system
    prompt each time.
-   Use JSON schema/structured output if supported by the current
    provider and Mubit path; validate the result with Zod regardless.
-   On invalid output, perform at most one repair call, also through
    Mubit, and record the failure.
-   Do not include secrets, proprietary customer code, or real
    vulnerability exploit details in synthetic training examples.

### Evaluation

Create a held-out set that is not used as training feedback. Measure: -
Plan/action correctness against expected labels. - Evidence-reference
validity (all referenced IDs exist). - Unsupported-claim rate. -
Required-action recall. - JSON/schema validity. - Latency and estimated
cost where available. - Human correction rate.

Show a baseline vs adapted comparison only when the adapter has
genuinely passed Mubit's checks and the evaluation was actually run. A
passing adapter's agreement with a provider model is not the same as
real-world security correctness; say so in the UI and demo.

## 7. Banyan Sapling verification protocol

Before coding the API client, inspect the live model card and
playground. Confirm: - HTTP method and content type. - Exact request
body fields. - Exact response schema and score semantics. -
Timeout/rate-limit behavior. - Whether any token is required despite the
quickstart's "no auth" note.

Use the endpoint from server-side code only. Store the base URL in
`BANYAN_SAPLING_URL` so it can be changed without editing source. Add a
short timeout and graceful fallback.

Each verification call should be narrowly framed. Example conceptual
claim:

> "The proposed remediation satisfies policy SEC-PHP-01 because the
> runtime version is upgraded to a fixed supported release and the
> relevant version check passes."

Policy must state the requirement. Evidence must include the actual
detected version/config, advisory affected/fixed range, patch diff
summary, and relevant check results. Do not ask Sapling to infer
evidence that was never provided.

If the verdict is uncertain, inconsistent, or insufficient, keep the
result uncertain and require review. Do not interpret a high score as
proof of security.

## 8. Security and engineering guardrails

-   Treat repository files, issue text, advisories, dependency metadata
    and model responses as untrusted input.
-   Defend against prompt injection inside repository comments/README
    files. Do not let repository text override system instructions or
    safety policies.
-   Limit ZIP size, file count, file size, path depth and text length.
    Reject path traversal and symlinks escaping the extraction root.
-   Never execute `composer scripts`, npm lifecycle scripts, arbitrary
    Makefiles, shell snippets or repository-provided CI commands as part
    of scanning.
-   If running tests is implemented, use an isolated sandbox/container
    with no secrets, restricted network, resource limits and an
    allowlist of commands. If that is too much for the hackathon, run
    only deterministic static checks on the fixture and label them
    accurately.
-   Escape code and advisory content in the UI; do not render untrusted
    HTML.
-   Store secrets only in environment variables. Never expose Mubit or
    provider keys to the client.
-   Do not send sensitive repository content to external services
    without clear user consent. Use a synthetic/demo repo for the
    hackathon.
-   Keep an audit trail of the input, evidence, proposed change, checks,
    verification output, and human decision.
-   No automatic merge, deploy, or destructive operation.

## 9. Environment variables

Create `.env.example` with placeholders only. Do not commit `.env`.

-   `MUBIT_API_KEY=` --- key from the Mubit workspace.
-   `MUBIT_BASE_URL=` --- exact provider-compatible base URL shown by
    Mubit Connect (use documented default only if confirmed).
-   `MUBIT_MODEL=` --- supported model identifier from the
    workspace/provider configuration.
-   `BANYAN_SAPLING_URL=https://6adbee0669a00298cd4774c9.endpoints.huggingface.cloud`
-   `DATABASE_URL=` --- only if using a database.
-   `GITHUB_TOKEN=` --- optional, only for GitHub integration.
-   `GITHUB_APP_ID=` / `GITHUB_PRIVATE_KEY=` --- optional if
    implementing GitHub App flow.

The app should start in demo mode without GitHub credentials. If Mubit
credentials are missing, show a clear setup error and provide a visibly
labelled local mock mode for UI development only. Never label mock
output as a real Mubit result.

## 10. Build order (optimise for a weekend)

### Phase 1 --- skeleton and demo fixture

-   Inspect repository and current framework.
-   Create a minimal PHP fixture with `composer.json`, a runtime
    declaration/Dockerfile, a few source files, tests or static checks,
    and a seeded advisory/policy.
-   Build the main screens using fixture data.
-   Confirm `npm run dev` and production build work.

### Phase 2 --- deterministic analysis

-   Parse manifests/configs safely.
-   Implement version/range checks for the selected scenario.
-   Show evidence and unknown states.
-   Write unit tests for affected/not-affected/unknown.

### Phase 3 --- real Mubit-backed task

-   Configure server-side Mubit client.
-   Implement one stable recurring task with schema validation.
-   Generate several varied synthetic examples and record run
    IDs/outcomes.
-   Verify the task appears in Mubit Requests/Tasks.
-   Keep a held-out evaluation set separate.

### Phase 4 --- Sapling verification

-   Inspect current schema from official model card/playground.
-   Implement server-side call, raw response storage, UI display,
    timeout and fallback.
-   Test all returned verdict types, including uncertain/insufficient
    evidence.

### Phase 5 --- patch and checks

-   Generate a small diff for the fixture.
-   Apply only to a copy of the fixture.
-   Run allowlisted deterministic checks; capture actual output/exit
    code.
-   Display diff and PR-ready summary.

### Phase 6 --- feedback + learning evidence

-   Add reviewer correction UI and persistent correction records.
-   Feed corrections/outcomes into the correct Mubit workflow.
-   Watch actual Mubit task/adapter state; run comparison if available.
-   If training cannot finish, show the genuine status and demonstrate
    the feedback data being captured without claiming model adaptation
    has completed.

### Phase 7 --- polish and rehearse

-   Seed a clean demo state.
-   Add loading, error and empty states.
-   Test from a fresh browser session.
-   Rehearse the 2--3 minute narrative and ensure the live Mubit
    component is visible.
-   Freeze scope before adding optional GitHub integration.

## 11. Acceptance criteria

The MVP is not done until all P0 items below pass:

-   [ ] User can select the demo PHP repository and a seeded advisory.
-   [ ] App shows inspected files, version/config evidence, and missing
    evidence.
-   [ ] Exposure result supports `affected`, `not_affected`, and
    `unknown`.
-   [ ] App creates a structured remediation plan with evidence
    references and human approval required.
-   [ ] App shows a proposed patch/diff and explains each change.
-   [ ] Checks are run for real or explicitly labelled as not run; no
    fabricated pass state.
-   [ ] Banyan Sapling is called through the server using its confirmed
    live API schema.
-   [ ] Exact Sapling verdict/scores and raw response are retained;
    uncertain results are not silently converted to pass.
-   [ ] LLM task calls route through Mubit, and the real request/task
    can be shown in the Mubit console.
-   [ ] Human correction is persisted with original output, corrected
    label/note, evidence, policy version and run ID.
-   [ ] Mubit training/adaptation status is represented honestly; no
    fake model-update claims.
-   [ ] Held-out evaluation is separate from correction/training
    examples.
-   [ ] App has clear loading/error states and runs from documented
    setup instructions.
-   [ ] No API keys in browser bundles, logs, source control or
    screenshots.
-   [ ] No arbitrary repository scripts run automatically.
-   [ ] Demo does not require a live GitHub token.

## 12. Demo script (target: 2--3 minutes)

1.  **Problem (15 sec):** "When a vulnerability is disclosed, teams
    still have to determine whether they're exposed, figure out what to
    change, and prove the fix respects their own engineering rules."
2.  **Input (20 sec):** Open the seeded legacy PHP repository and
    advisory.
3.  **Evidence (25 sec):** Show detected runtime/dependency/config facts
    and one missing/ambiguous item.
4.  **Plan (25 sec):** Generate a remediation plan and show why the
    change is runtime/configuration/code work.
5.  **Patch + checks (30 sec):** Show the diff, run the actual checks,
    and display their real results.
6.  **Verification (20 sec):** Show the specific claim, policy, evidence
    and actual Banyan Sapling verdict. Explain uncertainty when
    applicable.
7.  **Mubit learning (30 sec):** Correct a recurring task, show the
    request/task and recorded feedback in Mubit, then show actual
    adapter status or a real baseline/adapted comparison if available.
8.  **Close (10 sec):** "PatchPilot doesn't ask teams to trust an AI's
    claim that a vulnerability is fixed. It produces an evidence-backed,
    tested change for an engineer to approve."

If time is extremely tight, prioritise the complete happy path and Mubit
evidence over optional features.

## 13. Engineering team and market fit

Primary buyers/users: - Platform engineering and application security
teams at companies maintaining legacy PHP applications. - Engineering
leads responsible for security remediation and dependency/runtime
upgrades. - DevSecOps teams handling recurring vulnerability queues. -
Software consultancies maintaining many client codebases.

Likely adjacent users later: - JavaScript/Node teams maintaining older
frameworks and packages. - Teams upgrading runtimes/frameworks on a
regular cadence. - Internal developer-platform teams enforcing
engineering standards across many repositories.

Value proposition: - Reduce time from advisory to a reviewable
remediation proposal. - Make missing evidence and uncertainty
explicit. - Keep changes traceable to policies, advisory sources and
test results. - Learn team-specific remediation patterns from reviewed
outcomes. - Keep humans in control of merges and production changes.

Do not claim quantified time savings until measured. In the hackathon
demo, show a measured baseline (manual steps or a fixed reference task)
only if it is honestly recorded.

## 14. Final instructions to the coding agent

1.  First inspect the existing repository and report its framework,
    current state, and the smallest implementation path.
2.  Keep this file as the source of truth. If a choice is ambiguous,
    choose the smallest safe option that helps satisfy the rubric.
3.  Implement end-to-end in thin vertical slices; keep the app runnable
    after each phase.
4.  Do not spend time on multi-language support, billing, team
    management, or production-grade GitHub OAuth before the core demo
    works.
5.  Do not make up live API schemas. Inspect the official Mubit and
    Banyan Sapling docs first.
6.  Keep Mubit calls real and server-side. Clearly distinguish real
    calls from local mocks.
7.  Prefer deterministic checks for version comparisons and policy
    rules; use models where judgement/generalisation helps.
8.  Record real outputs and failures. Never fabricate tests, verdicts,
    adapter training, benchmarks or cost savings.
9.  Write a concise `README.md` with setup, environment variables, test
    commands, known limitations and demo instructions.
10. Before finishing, run lint/typecheck/tests/build where available,
    fix critical errors, and report what works, what is mocked, and what
    remains incomplete.

## Source links

-   Night Shift event, tracks, judging rubric and rules:
    https://luma.com/nightshift-london
-   Mubit docs: https://docs.mubit.ai/
-   Mubit first adapter guide:
    https://docs.mubit.ai/guides/first-adapter
-   Mubit patterns: https://docs.mubit.ai/patterns
-   Banyan Sapling playground:
    https://huggingface.co/spaces/MubitLabs/banyan-sapling-demo
-   Banyan Sapling model card:
    https://huggingface.co/MubitLabs/banyan-sapling
-   Banyan Sapling API endpoint:
    https://6adbee0669a00298cd4774c9.endpoints.huggingface.cloud
