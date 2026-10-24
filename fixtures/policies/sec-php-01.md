# SEC-PHP-01 — PHP runtime support policy

Version: 2026-10-24

1. Production PHP must be a currently supported release. PHP 7.4 is end-of-life and is not an acceptable runtime.
2. A remediation is acceptable only when the runtime pin, Composer platform constraint, and CI PHP version are updated to the same supported major.minor (8.2 or 8.3 in this programme).
3. An application source-code change cannot, by itself, remediate a vulnerable or unsupported PHP runtime.
4. Exposure status must be `unknown` when the runtime version cannot be established from repository evidence.
5. Banyan Sapling may only be asked to classify a claim that is fully grounded in supplied evidence. Do not treat a `supported` verdict as proof that production is safe.
6. Human approval is required before any change is merged.
