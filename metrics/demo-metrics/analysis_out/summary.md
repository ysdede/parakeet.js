# Metrics analysis: ONNX vs meljs preprocessor (matched samples only)

## Conclusions
- **RTFx:** meljs improves final RTFx on average (mean delta_rtfx = 1.802).
- **Bottleneck:** Preprocess share is lower with meljs (bottleneck shifts toward encoder/decoder).
- **Encoder/decoder:** Encoder/decoder deltas are small; meljs mainly affects preprocess.

## Key numbers
- Matched samples: 6
- Delta RTFx: mean=1.802, median=1.565, p90=4.005
- Delta total_ms: mean=12.2, median=-8.3
- Worst RTFx ONNX: 1.15x, meljs: 1.07x
- Biggest RTFx regression (min delta_rtfx): -0.250
- Biggest RTFx improvement (max delta_rtfx): 4.560

## Figures
- `figures/A_duration_vs_rtfx.png`: Duration vs RTFx (overlay ONNX vs meljs)
- `figures/B_duration_vs_stages_onnx.png`, `B_duration_vs_stages_meljs.png`: Duration vs stage times per mode
- `figures/C_duration_vs_delta_rtfx.png`: Duration vs delta RTFx
- `figures/D_rtfx_distributions.png`: RTFx and delta RTFx histograms
- `figures/E_bottleneck_stage_share.png`: Mean stage share (%) per mode

## Assumptions
- `total_ms` is taken from the Perf line (time in seconds x 1000) when the Object breakdown line is missing or lacks Total; otherwise from the Object Total field.
- Stage times (preprocess, encoder, decoder) come from the Object line when present; preprocess is also parsed from the Preprocessor line and overridden by Object when both exist.

## What to log next (actionable)
- Stage start/end timestamps (to detect waiting/overlap).
- Worker queue / postMessage latency (meljs).
- Warmup vs steady-state separation (e.g. first N samples flagged).
- Explicit total time definition (wall-clock) if not already present.