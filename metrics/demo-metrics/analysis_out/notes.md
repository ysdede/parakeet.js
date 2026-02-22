# Performance Analysis Findings

Based on the interactive dashboard analysis of the ONNX and meljs transcription logs, we draw the following conclusions.

## Scaling Behavior
1. **Total Time vs. Duration**: For both `ONNX` and `meljs`, total processing time scales roughly linearly with audio duration. 
2. **RTFx Improvement**: Real-Time Factor (RTFx) improves as audio duration increases, peaking at around **55.4x** for ONNX and **58.8x** for meljs on the longest samples (~45-60s). This indicates fixed overheads (like model invocation or initial memory allocation) become less significant for longer audio segments.

## meljs vs ONNX Comparison
1. **Overall Throughput**: `meljs` shows a measurable improvement in overall transcription efficiency. The Mean RTFx for `meljs` across its dataset is **28.09x**, compared to **25.22x** for `ONNX` — an **11.3% increase in mean throughput**.
2. **Bottlenecks and Stage Times**: 
   - Looking at the stage times scatter plot, the encoder execution times remain virtually identical between the two modes.
   - However, the preprocessing latency is consistently and significantly lower for `meljs`. As duration increases, the gap between the `meljs` preprocessor time and the `ONNX` preprocessor time widens favorably for `meljs`. 
   - Therefore, the throughput gains are almost entirely attributed to the efficiency of the `meljs` preprocessor logic compared to the WASM-based ONNX preprocessor.

## Suggestions for Future Logging
1. **Log Normalization Formats**: Currently, the stage times are heavily nested in log lines strings (e.g. `Preprocess'7.4 ms' Encode'84.2 ms'`). It would be better to log a machine-readable JSON line directly in the browser console alongside the human-readable text.
2. **Environment Specs**: Including basic device hardware metadata (e.g. memory available, core count via `navigator.hardwareConcurrency`) in the logs would allow us to cross-analyze performance across different devices.
3. **Finer Granularity**: If VAD is active, tracking VAD processing time separately from raw model processing time would be helpful.
