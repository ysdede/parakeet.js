## 2026-03-22 - Issue backlog triage after PR sweep

Summary:
- Reviewed the open issue queue against current `master` after the PR cleanup and perf merge pass.
- Closed stale issue `#92` as already implemented on `master`.
- Re-scoped `#80` to demo settings + hub-loading refactor.
- Re-scoped `#97` to local-folder model handling extraction from `examples/demo/src/App.jsx`.

Solved / closed:
- `#92` Follow-up nitpicks: local artifacts logging + close IndexedDB connections
  - Already implemented in `examples/demo/src/App.jsx`.

Highest-value small follow-ups:
- `#99` Missing space before dollar sign in some transcriptions
  - Likely tokenizer whitespace rule in `src/tokenizer.js`.
- `#81` Lazy-load demo settings instead of calling `loadSettings()` during render.
- `#83` Narrow forwarded options in `src/hub.js` when calling `getModelFile(...)`.
- `#82` Add deterministic test strategy for hub repo listing cache.

Medium follow-ups:
- `#79` Retry demo FP16 -> FP32 only for FP16-related failures.
- `#96` Benchmark tooling robustness (`tests/bench_ops.mjs`, `metrics/analyze-benchmark.js`).
- `#97` Extract local-folder model handling out of `examples/demo/src/App.jsx`.
- `#47` Guard ORT initialization/session setup against concurrent callers.

Larger / architectural:
- `#80` Refactor demo settings and hub model-loading flow.
- `#45` Worker/off-main-thread inference support.
- `#78` Dev-only audit vulnerability follow-up for Tailwind/Sucrase chain.
- `#98` Verify benchmark GPU metadata from external evidence before editing the report.

Recommended implementation order:
1. `#99`, `#81`, `#83`, `#82`
2. `#79`, `#96`, `#97`
3. `#47`
4. `#45`, `#78`, `#80`, `#98`

Action:
- Treat GitHub issues as source of truth for current state.
- Use this note as the local handoff summary for future Codex sessions.
