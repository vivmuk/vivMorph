# Benchmark: Insertion (Trump) ? single-source

Run: 2026-07-10T01:55:50.846Z

| Rank | Model | Verdict | Adherence | Realism | Preservation | Score | Cost |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Grok Imagine | pass | 10 | 9 | 10 | 97 | $0.040 |
| 2 | GPT Image 1.5 | pass | 10 | 9 | 10 | 97 | $0.360 |
| 3 | Qwen Image 2 | pass | 10 | 8 | 10 | 94 | $0.050 |
| 4 | Wan 2.7 Pro Edit | partial | 10 | 8 | 10 | 94 | $0.094 |
| 5 | Nano Banana Pro | partial | 10 | 8 | 10 | 94 | $0.180 |
| 6 | Flux 2 Max | partial | 8 | 9 | 10 | 87 | $0.190 |

## Reliability

| Model | Result | HTTP | Attempts | Time | Note |
| --- | --- | ---: | ---: | ---: | --- |
| Grok Imagine | OK | 200 | 1 | 21.1s |  |
| Qwen Image 2 | OK | 200 | 1 | 20.5s |  |
| Seedream V5 Pro | FAIL | 422 | 1 | 153.8s | Your prompt violates the content policy of Venice.ai or the model provider |
| Wan 2.7 Pro Edit | OK | 200 | 1 | 25.2s |  |
| Flux 2 Max | OK | 200 | 1 | 29.2s |  |
| Nano Banana Pro | OK | 200 | 1 | 36.3s |  |
| GPT Image 1.5 | OK | 200 | 1 | 54.2s |  |