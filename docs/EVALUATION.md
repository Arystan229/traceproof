# Evaluation procedure

## What is already testable without provider access

Run `pnpm test`. These deterministic tests exercise grounding and mocked HTTP contracts. Passing them is not evidence of model accuracy or live provider availability.

## First real Nebius run

1. Open Connections and configure your key, or use a server secret.
2. New review → Use sample inputs → Run evidence review.
3. Export JSON and verify `mode` is `live`, `nebiusCalls` is `2`, and `model` is the expected NVIDIA model.
4. Run `node scripts/verify-report.mjs path/to/export.json`.
5. Inspect each claim and quote manually. A claim extraction cap means a model may select a different subset than the fixture.

The fictional reference case contains these expected relationships:

| Claim | Expected interpretation |
| --- | --- |
| SSO in every plan | Contradicted: Enterprise only |
| All data exclusively in EU | Contradicted: optional Frankfurt on Enterprise; default Virginia |
| Encryption in transit and at rest | Supported by the policy text |
| Backups deleted in 24 hours | Contradicted: backup retention is 30 days |
| 99.99% uptime guaranteed | Insufficient evidence |

Record selected-claim coverage separately from classification accuracy. Do not count an omitted claim as correctly reviewed. Also note malformed outputs and rejected quotations.

## Tavily integration check

Use a short public factual document with web research enabled and a valid Tavily key. Confirm `tavilyCalls > 0`, source origins are `tavily-page` or `tavily-excerpt`, retrieval timestamps exist, and URLs resolve. Save the exported receipt. Search results may change over time and are not a fixed factual benchmark.

## Feedback worksheet

| Run | Actual model | Selected / expected claims | Correct interpretations | Rejected citations | Nebius calls | Tavily calls | Tokens in/out | Duration | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| To be measured | | | | | | | | | |

Ratings must reflect actual runs. If comparing models, reuse identical source snapshots, prompt templates, selected claims, and scoring rules; report sample size, failures, cost and latency separately. No such comparison has yet been conducted.
