# baton eval report

Run: `video-3`

## Test 4: 20 tasks end to end

1 repeat per arm. Success shows the mean, then min to max across repeats. Unusable steps are planner replies with no action the harness could run.

| arm | success (mean, min-max) | claimed done but failed | mean steps | unusable steps | median s/task | $/task (Clef + LLM) | LLM tokens in/out per task | screenshots sent to LLM | errors |
|---|---|---|---|---|---|---|---|---|---|
| pilot | **1.0/1** (1-1) | 0 | 6.0 | 0.0% | 6.7 | $0.00280 ($0.00280 + $0.00000) | 0 / 0 | 0.0 | 0 |
| vision:kimi-k2.6 | **0.0/1** (0-0) | 0 | 15.0 | 0.0% | 84.1 | $0.024 ($0.00000 + $0.024) | 24648 / 210 | 15.0 | 0 |

| task | pilot | vision:kimi-k2.6 |
|---|---|---|
| cross-chat-mail | 1/1 | 0/1 |

Total spend recorded in this run: $0.027.
