# baton eval report

Run: `video-1`

## Test 4: 20 tasks end to end

1 repeat per arm. Success shows the mean, then min to max across repeats. Unusable steps are planner replies with no action the harness could run.

| arm | success (mean, min-max) | claimed done but failed | mean steps | unusable steps | median s/task | $/task (Clef + LLM) | LLM tokens in/out per task | screenshots sent to LLM | errors |
|---|---|---|---|---|---|---|---|---|---|
| pilot | **1.0/1** (1-1) | 0 | 5.0 | 0.0% | 6.7 | $0.00203 ($0.00203 + $0.00000) | 0 / 0 | 0.0 | 0 |
| vision:kimi-k2.6 | **1.0/1** (1-1) | 0 | 13.0 | 0.0% | 25.6 | $0.021 ($0.00000 + $0.021) | 21131 / 175 | 13.0 | 0 |
| vision:qwen3.8-27b | **0.0/1** (0-0) | 0 | 15.0 | 0.0% | 432.5 | $0.035 ($0.00000 + $0.035) | 20785 / 8164 | 15.0 | 0 |

| task | pilot | vision:kimi-k2.6 | vision:qwen3.8-27b |
|---|---|---|---|
| shop-order | 1/1 | 1/1 | 0/1 |

Total spend recorded in this run: $0.058.
