# Open Patch

Policy-aware runtime migrations with independently verified evidence and a [Mubit](https://docs.mubit.ai/) learning loop. Built for [Night Shift](https://luma.com/nightshift-london).

This is **not** another Snyk / OpenHands / Aider. Those find CVEs or edit trees. Open Patch decides which *kind* of migration is legal, checks the claim with [Banyan Sapling](https://huggingface.co/MubitLabs/banyan-sapling), and keeps reviewer corrections on one frozen Mubit task. PHP 7.4 is this month’s fire, not the product.

The Mubit system prompt still starts with `You are PatchPilot's advisory-to-migration-plan task.` That string is frozen so training does not restart. Do not rename it.

## What it does

1. Inventories a bundled PHP fixture (or an uploaded ZIP) without executing repository scripts.
2. Compares runtime/dependency evidence to a seeded advisory and returns `affected`, `not_affected`, or `unknown`.
3. Asks Mubit for a structured remediation plan (`advisory_to_migration_plan`).
4. Proposes a small config/runtime diff for the pins that actually exist, runs allowlisted static checks, and marks the scan `review_ready` only when those checks pass. Missing pin files are skipped, not failed.
5. Sends a specific claim, policy, and evidence to Banyan Sapling and keeps the raw verdict, including `unsure`.
6. Records human corrections. It does **not** claim that a correction instantly trained a model.

## Setup

```bash
git clone https://github.com/Ahamisi/open-patch.git
cd open-patch
cp .env.example .env
# put your Mubit key in .env — server-side only
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
| --- | --- |
| `MUBIT_API_KEY` | Workspace key (`mbt_…`). Never sent to the browser. |
| `MUBIT_BASE_URL` | Default `https://api.mubit.ai/openai/v1` |
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

Harbor Ledger is a **synthetic fixture we wrote**. It is not a real company. Use it when you need a reliable PHP 7.4 pin.

For real public code, the app can fetch GitHub archives at scan time, or you can download the ZIP yourself and upload it:

- [laravel/laravel 12.x](https://github.com/laravel/laravel/archive/refs/heads/12.x.zip)
- [laravel/laravel v8.6.12](https://github.com/laravel/laravel/archive/refs/tags/v8.6.12.zip)
- [slimphp/Slim-Skeleton](https://github.com/slimphp/Slim-Skeleton/archive/refs/heads/master.zip)
- [symfony/demo](https://github.com/symfony/demo/archive/refs/heads/main.zip)

Exposure is computed from whatever is actually in the archive. A modern Laravel skeleton with `require.php: ^8.2` and no Docker pin is inferred as `not_affected` for the 7.4 EOL advisory, with that limitation stated. An older `^7.3|^8.0` constraint without a pin is `unknown`.

## Demo (2–3 minutes)

1. New scan → Harbor Ledger + **PHP 7.4 is end-of-life**.
2. Evidence shows Dockerfile `php:7.4-apache`, Composer `<8.0`, CI `7.4`, and two **missing** production facts.
3. Create remediation plan — a real Mubit request ID appears.
4. Generate the PHP 8.2 pin patch and run checks. Missing files are skipped. `review_ready` means the pins that existed moved and the checks that apply passed — a human still has to approve.
5. Verify with Sapling. The official example often returns `status: unsure` even when `raw_label` is `violation`. Leave it uncertain.
6. Mark the plan `incorrect` with a runtime-upgrade note, then open **Learning** and the Mubit console Requests page.

Also try the Imagick advisory (`not_affected`) and the Windows CGI advisory (`unknown`).

## Mubit task design

- Stable system prompt: `You are PatchPilot's advisory-to-migration-plan task.`
- Same model and `response_format: json_object` on every call.
- Variable content stays in the user message.
- Synthetic examples use that same task.
- Held-out evaluation sends `x-middleware-store: false` so those calls are not kept as training examples.
- Training usually starts around 25 kept examples. The console count is authoritative. This app never claims an adapter passed unless you can see that in the console.

## Banyan Sapling contract (live, inspected)

```http
POST $BANYAN_SAPLING_URL
Content-Type: application/json

{ "inputs": { "policy": "...", "evidence": "...", "claim": "..." } }
```

Response fields preserved as returned: `status`, `raw_label`, `probabilities`, `prediction_set`, `conformal_prediction_set`, `logits`, `status_provenance`, `usage`, `timing_ms`.

## Known limitations

- PHP only. No GitHub import or pull request.
- Checks are allowlisted static parsers. Composer scripts, container builds, and repository CI are never executed.
- Production OS/SAPI is not observed; Windows CGI stays `unknown`.
- Sapling classifies supplied text. It is not a scanner or exploit proof.
- Adapter training may not finish during the event. The UI says `Collecting examples` unless the console shows otherwise.

## Safety

- ZIP path traversal, symlinks, size, depth, and file-count limits are enforced.
- Repository README and comments cannot override system instructions.
- No automatic merge or deploy.
- Secrets stay in environment variables.
