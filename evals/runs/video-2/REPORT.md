# baton eval report

Run: `video-2`

## Test 4: 20 tasks end to end

1 repeat per arm. Success shows the mean, then min to max across repeats. Unusable steps are planner replies with no action the harness could run.

| arm | success (mean, min-max) | claimed done but failed | mean steps | unusable steps | median s/task | $/task (Clef + LLM) | LLM tokens in/out per task | screenshots sent to LLM | errors |
|---|---|---|---|---|---|---|---|---|---|
| pilot | **3.0/3** (3-3) | 0 | 5.3 | 0.0% | 6.5 | $0.00227 ($0.00227 + $0.00000) | 0 / 0 | 0.0 | 0 |
| vision:kimi-k2.6 | **1.0/3** (1-1) | 0 | 12.0 | 0.0% | 31.8 | $0.019 ($0.00000 + $0.019) | 19549 / 164 | 12.0 | 0 |
| vision:qwen3.8-27b | **0.0/3** (0-0) | 0 | 15.0 | 2.2% | 159.7 | $0.013 ($0.00000 + $0.013) | 20656 / 1302 | 15.0 | 0 |

| task | pilot | vision:kimi-k2.6 | vision:qwen3.8-27b |
|---|---|---|---|
| chat-attach-send | 1/1 | 0/1 | 0/1 |
| shop-order | 1/1 | 1/1 | 0/1 |
| cross-chat-mail | 1/1 | 0/1 | 0/1 |

Total spend recorded in this run: $0.105.
