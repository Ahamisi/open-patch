# SEC-RUNTIME-01 — Unsupported runtime policy

Version: 2026-10-24

1. Production runtimes must be currently supported. An end-of-life interpreter (PHP 7.4, Node 16, Python 3.8, or any other EOL runtime named by the advisory) is not an acceptable runtime.
2. A remediation is acceptable only when the runtime pin, manifest constraint, and CI version that exist in the repository are updated to the same supported major.minor.
3. An application source-code change cannot, by itself, remediate a vulnerable or unsupported runtime.
4. Exposure status must be `unknown` when the runtime version cannot be established from repository evidence.
5. Banyan Sapling may only be asked to classify a claim that is fully grounded in supplied evidence. Do not treat a `supported` verdict as proof that production is safe.
6. Human approval is required before any change is merged.

PHP 7.4 is the current incident that made this policy urgent. The same rules apply to every language pack.
