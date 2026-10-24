# SEC-RUNTIME-01-REFRESH — Unsupported runtime policy (fast refresh)

Version: 2026-10-24-refresh

Same rules as SEC-RUNTIME-01, with one house-rule change:

1. Production runtimes must be currently supported.
2. The team's accepted PHP line is now **8.3.x**, not 8.2.x. A pin that still reads 8.2 is out of policy even if last week's review called it correct.
3. An application source-code change cannot, by itself, remediate a vulnerable or unsupported runtime.
4. Exposure status must be `unknown` when the runtime version cannot be established from repository evidence.
5. Human approval is required before any change is merged.

This file is a policy flip. It must travel in the **user message** (`policyVersion`). Do not change the Mubit system prompt.
