"""
Analyze ONNX vs meljs preprocessor metrics logs.
Uses only matched samples (same audio across both runs). Outputs to analysis_out/.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:
    plt = None

METRICS_DIR = Path(__file__).resolve().parent
ONNX_LOG = METRICS_DIR / "ysdede.github.io-1771680286452--onnx-preprocessor--v2-encoder-32-decoder-wasm-8.log"
MELJS_LOG = METRICS_DIR / "ysdede.github.io-1771680737564-meljs-preprocessor--v2-encoder-32-decoder-wasm-8.log"
OUT_DIR = METRICS_DIR / "analysis_out"
FIGURES_DIR = OUT_DIR / "figures"

# Assumption: when total_ms is missing from Object line, we use (time from Perf line) * 1000.
# Stage times (pre/enc/dec) from Object; if Object has Total we use it, else total_ms = time_s * 1000.
DURATION_TOLERANCE_S = 0.02  # for duration-based matching when reference missing


def _parse_object_line(line: str) -> dict | None:
    """Extract Preprocess, Encode, Decode, Total from Object line. Supports both quote styles."""
    out = {}
    # Style 1: Preprocess'7.4 ms' Encode'84.2 ms' Decode'25.2 ms' Total'118.0 ms'
    m = re.search(r"Preprocess['\"]?\s*([\d.]+)\s*ms", line)
    if m:
        out["preprocess_ms"] = float(m.group(1))
    m = re.search(r"Encode['\"]?\s*:\s*['\"]?([\d.]+)\s*ms|Encode['\"]?\s*([\d.]+)\s*ms", line)
    if m:
        out["encoder_ms"] = float(m.group(1) or m.group(2))
    m = re.search(r"Decode['\"]?\s*:\s*['\"]?([\d.]+)\s*ms|Decode['\"]?\s*([\d.]+)\s*ms", line)
    if m:
        out["decoder_ms"] = float(m.group(1) or m.group(2))
    m = re.search(r"Total['\"]?\s*:\s*['\"]?([\d.]+)\s*ms|Total['\"]?\s*([\d.]+)\s*ms", line)
    if m:
        out["total_ms"] = float(m.group(1) or m.group(2))
    return out if out else None


def load_log(path: Path, mode_name: str) -> pd.DataFrame:
    """Load a single .log file (browser-console style). Returns normalized rows with required fields."""
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    ref_re = re.compile(r'\[Dataset\] Reference:\s*"([^"]*)"')
    preproc_re = re.compile(r"\[Parakeet\] Preprocessor:\s*\w+,\s*(\d+)\s*frames.*?([\d.]+)\s*ms")
    perf_re = re.compile(r"\[Perf\] RTF:\s*([\d.]+)x\s*\(audio\s*([\d.]+)\s*s,\s*time\s*([\d.]+)\s*s\)")

    rows = []
    i = 0
    current_ref = None
    while i < len(lines):
        line = lines[i]
        ref_m = ref_re.search(line)
        if ref_m:
            current_ref = ref_m.group(1).strip()
            i += 1
            continue
        pre_m = preproc_re.search(line)
        if pre_m:
            preprocess_ms = float(pre_m.group(2))
            i += 1
            if i >= len(lines):
                break
            perf_m = perf_re.search(lines[i])
            if not perf_m:
                i += 1
                continue
            rtfx = float(perf_m.group(1))
            duration_s = float(perf_m.group(2))
            time_s = float(perf_m.group(3))
            total_ms = time_s * 1000.0
            encoder_ms = decoder_ms = np.nan
            obj = None
            if i + 1 < len(lines):
                obj = _parse_object_line(lines[i + 1])
            if obj:
                encoder_ms = obj.get("encoder_ms", np.nan)
                decoder_ms = obj.get("decoder_ms", np.nan)
                if "total_ms" in obj:
                    total_ms = obj["total_ms"]
                if "preprocess_ms" in obj:
                    preprocess_ms = obj["preprocess_ms"]
            rtfx_computed = (total_ms / 1000.0) / duration_s if duration_s > 0 else np.nan
            rows.append({
                "reference": current_ref,
                "duration_s": duration_s,
                "preprocess_ms": preprocess_ms,
                "encoder_ms": encoder_ms,
                "decoder_ms": decoder_ms,
                "total_ms": total_ms,
                "rtfx_total": rtfx,
                "mode": mode_name,
            })
            i += 1
            continue
        i += 1

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    # If rtfx_total missing (shouldn't be), compute
    miss = df["rtfx_total"].isna()
    if miss.any():
        df.loc[miss, "rtfx_total"] = (df.loc[miss, "total_ms"] / 1000.0) / df.loc[miss, "duration_s"]
    return df


def build_matched(
    onnx_df: pd.DataFrame, meljs_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Match rows by reference (primary) or duration_s with tolerance.
    Drops ambiguous or low-confidence matches. Returns one row per matched sample with both modes + deltas.
    """
    # Key: normalized reference (strip) or None; value: list of (duration_s, row_idx, df)
    def by_ref(df: pd.DataFrame):
        key_to_rows = {}
        for idx, row in df.iterrows():
            ref = row["reference"]
            if pd.isna(ref) or ref == "" or ref is None:
                key = ("__duration__", round(row["duration_s"], 3))
            else:
                key = ("__ref__", ref.strip())
            key_to_rows.setdefault(key, []).append((row["duration_s"], idx, row))
        return key_to_rows

    onnx_by = by_ref(onnx_df)
    meljs_by = by_ref(meljs_df)

    # Match by reference first
    all_refs = set(k for t, k in onnx_by if t == "__ref__") & set(k for t, k in meljs_by if t == "__ref__")
    matched_rows = []
    used_onnx = set()
    used_meljs = set()

    for ref in all_refs:
        ok = onnx_by.get(("__ref__", ref), [])
        mk = meljs_by.get(("__ref__", ref), [])
        if len(ok) != 1 or len(mk) != 1:
            continue
        (_, oidx, orow), (_, midx, mrow) = ok[0], mk[0]
        if abs(orow["duration_s"] - mrow["duration_s"]) > DURATION_TOLERANCE_S:
            continue
        used_onnx.add(oidx)
        used_meljs.add(midx)
        duration_s = orow["duration_s"]
        matched_rows.append({
            "audio_id": ref[:80] + ("..." if len(ref) > 80 else ""),
            "reference": ref,
            "duration_s": duration_s,
            "preprocess_ms_onnx": orow["preprocess_ms"],
            "encoder_ms_onnx": orow["encoder_ms"],
            "decoder_ms_onnx": orow["decoder_ms"],
            "total_ms_onnx": orow["total_ms"],
            "rtfx_onnx": orow["rtfx_total"],
            "preprocess_ms_meljs": mrow["preprocess_ms"],
            "encoder_ms_meljs": mrow["encoder_ms"],
            "decoder_ms_meljs": mrow["decoder_ms"],
            "total_ms_meljs": mrow["total_ms"],
            "rtfx_meljs": mrow["rtfx_total"],
        })

    # Match by duration only for samples without reference (e.g. first sample life_Jim.wav)
    onnx_dur_rows = []
    for key in onnx_by:
        if key[0] != "__duration__":
            continue
        for (d, oidx, orow) in onnx_by[key]:
            onnx_dur_rows.append((d, oidx, orow))
    meljs_dur_rows = []
    for key in meljs_by:
        if key[0] != "__duration__":
            continue
        for (d, midx, mrow) in meljs_by[key]:
            meljs_dur_rows.append((d, midx, mrow))
    for (d, oidx, orow) in onnx_dur_rows:
        if oidx in used_onnx:
            continue
        cands = [(midx, mrow) for (md, midx, mrow) in meljs_dur_rows if midx not in used_meljs and abs(md - d) <= DURATION_TOLERANCE_S]
        if len(cands) != 1:
            continue
        midx, mrow = cands[0]
        used_onnx.add(oidx)
        used_meljs.add(midx)
        matched_rows.append({
            "audio_id": f"duration_{orow['duration_s']:.2f}s",
            "reference": "",
            "duration_s": orow["duration_s"],
            "preprocess_ms_onnx": orow["preprocess_ms"],
            "encoder_ms_onnx": orow["encoder_ms"],
            "decoder_ms_onnx": orow["decoder_ms"],
            "total_ms_onnx": orow["total_ms"],
            "rtfx_onnx": orow["rtfx_total"],
            "preprocess_ms_meljs": mrow["preprocess_ms"],
            "encoder_ms_meljs": mrow["encoder_ms"],
            "decoder_ms_meljs": mrow["decoder_ms"],
            "total_ms_meljs": mrow["total_ms"],
            "rtfx_meljs": mrow["rtfx_total"],
        })

    # Fallback: match unmatched by duration_s only when unique (1:1) to increase matches
    onnx_unmatched = [ (idx, row) for idx, row in onnx_df.iterrows() if idx not in used_onnx ]
    from collections import defaultdict
    meljs_unmatched = [ (idx, row) for idx, row in meljs_df.iterrows() if idx not in used_meljs ]
    def duration_key(r):
        return round(r["duration_s"], 2)
    onnx_by_d = defaultdict(list)
    for idx, row in onnx_unmatched:
        onnx_by_d[duration_key(row)].append((idx, row))
    meljs_by_d = defaultdict(list)
    for idx, row in meljs_unmatched:
        meljs_by_d[duration_key(row)].append((idx, row))
    for d in list(onnx_by_d.keys()):
        if d not in meljs_by_d or len(onnx_by_d[d]) != 1 or len(meljs_by_d[d]) != 1:
            continue
        (oidx, orow), (midx, mrow) = onnx_by_d[d][0], meljs_by_d[d][0]
        if abs(orow["duration_s"] - mrow["duration_s"]) > DURATION_TOLERANCE_S:
            continue
        used_onnx.add(oidx)
        used_meljs.add(midx)
        ref = orow["reference"] if pd.notna(orow["reference"]) and orow["reference"] else ""
        matched_rows.append({
            "audio_id": (ref[:80] + "...") if len(ref) > 80 else (ref or f"duration_{orow['duration_s']:.2f}s"),
            "reference": ref,
            "duration_s": orow["duration_s"],
            "preprocess_ms_onnx": orow["preprocess_ms"],
            "encoder_ms_onnx": orow["encoder_ms"],
            "decoder_ms_onnx": orow["decoder_ms"],
            "total_ms_onnx": orow["total_ms"],
            "rtfx_onnx": orow["rtfx_total"],
            "preprocess_ms_meljs": mrow["preprocess_ms"],
            "encoder_ms_meljs": mrow["encoder_ms"],
            "decoder_ms_meljs": mrow["decoder_ms"],
            "total_ms_meljs": mrow["total_ms"],
            "rtfx_meljs": mrow["rtfx_total"],
        })

    return pd.DataFrame(matched_rows)


def derived_and_deltas(matched: pd.DataFrame) -> pd.DataFrame:
    """Add derived metrics and deltas. Drops rows with missing stage times if needed for shares."""
    df = matched.copy()
    for mode, pre, enc, dec, tot, rtf in [
        ("onnx", "preprocess_ms_onnx", "encoder_ms_onnx", "decoder_ms_onnx", "total_ms_onnx", "rtfx_onnx"),
        ("meljs", "preprocess_ms_meljs", "encoder_ms_meljs", "decoder_ms_meljs", "total_ms_meljs", "rtfx_meljs"),
    ]:
        d = df["duration_s"]
        df[f"ms_per_sec_pre_{mode}"] = df[pre] / d
        df[f"ms_per_sec_enc_{mode}"] = df[enc] / d
        df[f"ms_per_sec_dec_{mode}"] = df[dec] / d
        df[f"ms_per_sec_total_{mode}"] = df[tot] / d
        t = df[tot].replace(0, np.nan)
        df[f"pre_pct_{mode}"] = 100 * df[pre] / t
        df[f"enc_pct_{mode}"] = 100 * df[enc] / t
        df[f"dec_pct_{mode}"] = 100 * df[dec] / t
    df["delta_rtfx"] = df["rtfx_meljs"] - df["rtfx_onnx"]
    df["delta_pre_ms"] = df["preprocess_ms_meljs"] - df["preprocess_ms_onnx"]
    df["delta_enc_ms"] = df["encoder_ms_meljs"] - df["encoder_ms_onnx"]
    df["delta_dec_ms"] = df["decoder_ms_meljs"] - df["decoder_ms_onnx"]
    df["delta_total_ms"] = df["total_ms_meljs"] - df["total_ms_onnx"]
    df["delta_ms_per_sec_pre"] = df["ms_per_sec_pre_meljs"] - df["ms_per_sec_pre_onnx"]
    df["delta_ms_per_sec_enc"] = df["ms_per_sec_enc_meljs"] - df["ms_per_sec_enc_onnx"]
    df["delta_ms_per_sec_dec"] = df["ms_per_sec_dec_meljs"] - df["ms_per_sec_dec_onnx"]
    return df


def duration_vs_performance(matched: pd.DataFrame) -> dict:
    """Correlations and linear fits (duration_s -> stage/total/rtfx) per mode."""
    result = {"onnx": {}, "meljs": {}}
    for mode in ["onnx", "meljs"]:
        pre = f"preprocess_ms_{mode}" if mode == "onnx" else "preprocess_ms_meljs"
        enc = f"encoder_ms_{mode}" if mode == "onnx" else "encoder_ms_meljs"
        dec = f"decoder_ms_{mode}" if mode == "onnx" else "decoder_ms_meljs"
        tot = f"total_ms_{mode}" if mode == "onnx" else "total_ms_meljs"
        rtf = f"rtfx_{mode}" if mode == "onnx" else "rtfx_meljs"
        x = matched["duration_s"].values
        for name, ykey in [
            ("preprocess_ms", pre),
            ("encoder_ms", enc),
            ("decoder_ms", dec),
            ("total_ms", tot),
            ("rtfx_total", rtf),
            ("ms_per_sec_pre", f"ms_per_sec_pre_{mode}"),
            ("ms_per_sec_enc", f"ms_per_sec_enc_{mode}"),
            ("ms_per_sec_dec", f"ms_per_sec_dec_{mode}"),
            ("ms_per_sec_total", f"ms_per_sec_total_{mode}"),
        ]:
            y = matched[ykey].values
            valid = np.isfinite(y)
            if valid.sum() < 2:
                result[mode][name] = {"corr": None, "slope": None, "intercept": None}
                continue
            xx, yy = x[valid], y[valid]
            corr = float(np.corrcoef(xx, yy)[0, 1]) if np.std(yy) > 0 else None
            if np.std(xx) > 0:
                coeffs = np.polyfit(xx, yy, 1)
                result[mode][name] = {"corr": corr, "slope": float(coeffs[0]), "intercept": float(coeffs[1])}
            else:
                result[mode][name] = {"corr": corr, "slope": None, "intercept": None}
    return result


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    onnx_df = load_log(ONNX_LOG, "onnx")
    meljs_df = load_log(MELJS_LOG, "meljs")

    matched = build_matched(onnx_df, meljs_df)
    matched = derived_and_deltas(matched)

    # Drop rows with NaN in key fields for downstream (keep for matched_table but mark)
    matched_clean = matched.dropna(subset=["rtfx_onnx", "rtfx_meljs", "total_ms_onnx", "total_ms_meljs"])

    # --- Aggregates and mode comparison ---
    delta_rtfx = matched_clean["delta_rtfx"]
    delta_total = matched_clean["delta_total_ms"]
    agg = {
        "n_matched": int(len(matched_clean)),
        "delta_rtfx": {
            "mean": float(delta_rtfx.mean()),
            "median": float(delta_rtfx.median()),
            "p90": float(delta_rtfx.quantile(0.9)),
        },
        "delta_total_ms": {
            "mean": float(delta_total.mean()),
            "median": float(delta_total.median()),
            "p90": float(delta_total.quantile(0.9)),
        },
        "delta_pre_ms": {"mean": float(matched_clean["delta_pre_ms"].mean()), "median": float(matched_clean["delta_pre_ms"].median())},
        "delta_enc_ms": {"mean": float(matched_clean["delta_enc_ms"].mean()), "median": float(matched_clean["delta_enc_ms"].median())},
        "delta_dec_ms": {"mean": float(matched_clean["delta_dec_ms"].mean()), "median": float(matched_clean["delta_dec_ms"].median())},
        "worst_rtfx_onnx": float(matched_clean["rtfx_onnx"].min()),
        "worst_rtfx_meljs": float(matched_clean["rtfx_meljs"].min()),
        "best_rtfx_onnx": float(matched_clean["rtfx_onnx"].max()),
        "best_rtfx_meljs": float(matched_clean["rtfx_meljs"].max()),
        "biggest_rtfx_regression": float(delta_rtfx.min()),
        "biggest_rtfx_improvement": float(delta_rtfx.max()),
    }
    dur_perf = duration_vs_performance(matched_clean)
    stats = {"aggregates": agg, "duration_vs_performance": dur_perf}

    # --- Charts ---
    if plt is not None:
        # A: Scatter duration vs RTFx (overlay onnx vs meljs)
        fig, ax = plt.subplots()
        ax.scatter(matched_clean["duration_s"], matched_clean["rtfx_onnx"], label="ONNX", alpha=0.7, s=20)
        ax.scatter(matched_clean["duration_s"], matched_clean["rtfx_meljs"], label="meljs", alpha=0.7, s=20)
        ax.set_xlabel("duration_s")
        ax.set_ylabel("rtfx_total")
        ax.set_title("Duration vs RTFx (matched samples)")
        ax.legend()
        ax.grid(True, alpha=0.3)
        fig.savefig(FIGURES_DIR / "A_duration_vs_rtfx.png", dpi=120, bbox_inches="tight")
        plt.close(fig)

        # B: Duration vs stage times (one plot per mode)
        for mode, label in [("onnx", "ONNX"), ("meljs", "meljs")]:
            fig, ax = plt.subplots()
            pre = f"preprocess_ms_{mode}" if mode == "onnx" else "preprocess_ms_meljs"
            enc = f"encoder_ms_{mode}" if mode == "onnx" else "encoder_ms_meljs"
            dec = f"decoder_ms_{mode}" if mode == "onnx" else "decoder_ms_meljs"
            tot = f"total_ms_{mode}" if mode == "onnx" else "total_ms_meljs"
            ax.scatter(matched_clean["duration_s"], matched_clean[pre], label="preprocess_ms", alpha=0.7, s=15)
            ax.scatter(matched_clean["duration_s"], matched_clean[enc], label="encoder_ms", alpha=0.7, s=15)
            ax.scatter(matched_clean["duration_s"], matched_clean[dec], label="decoder_ms", alpha=0.7, s=15)
            ax.scatter(matched_clean["duration_s"], matched_clean[tot], label="total_ms", alpha=0.7, s=15)
            ax.set_xlabel("duration_s")
            ax.set_ylabel("ms")
            ax.set_title(f"Duration vs stage times ({label})")
            ax.legend()
            ax.grid(True, alpha=0.3)
            fig.savefig(FIGURES_DIR / f"B_duration_vs_stages_{mode}.png", dpi=120, bbox_inches="tight")
            plt.close(fig)

        # C: Delta plot duration vs delta RTFx
        fig, ax = plt.subplots()
        ax.scatter(matched_clean["duration_s"], matched_clean["delta_rtfx"], alpha=0.7, s=20)
        ax.axhline(0, color="gray", linestyle="--")
        ax.set_xlabel("duration_s")
        ax.set_ylabel("delta_rtfx (meljs - onnx)")
        ax.set_title("Duration vs Delta RTFx")
        ax.grid(True, alpha=0.3)
        fig.savefig(FIGURES_DIR / "C_duration_vs_delta_rtfx.png", dpi=120, bbox_inches="tight")
        plt.close(fig)

        # D: Distribution comparison
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        axes[0].hist(matched_clean["rtfx_onnx"], bins=20, alpha=0.6, label="ONNX", density=True)
        axes[0].hist(matched_clean["rtfx_meljs"], bins=20, alpha=0.6, label="meljs", density=True)
        axes[0].set_xlabel("rtfx_total")
        axes[0].set_ylabel("density")
        axes[0].set_title("RTFx distribution (matched)")
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        axes[1].hist(matched_clean["delta_rtfx"], bins=20, alpha=0.7, color="green", density=True)
        axes[1].axvline(0, color="gray", linestyle="--")
        axes[1].set_xlabel("delta_rtfx")
        axes[1].set_ylabel("density")
        axes[1].set_title("Delta RTFx distribution")
        axes[1].grid(True, alpha=0.3)
        fig.savefig(FIGURES_DIR / "D_rtfx_distributions.png", dpi=120, bbox_inches="tight")
        plt.close(fig)

        # E: Bottleneck view (mean stage share % per mode)
        fig, ax = plt.subplots()
        modes = ["onnx", "meljs"]
        pre_pct = [matched_clean[f"pre_pct_{m}"].mean() for m in modes]
        enc_pct = [matched_clean[f"enc_pct_{m}"].mean() for m in modes]
        dec_pct = [matched_clean[f"dec_pct_{m}"].mean() for m in modes]
        x = np.arange(len(modes))
        w = 0.35
        ax.bar(x - w, pre_pct, w, label="pre %")
        ax.bar(x, enc_pct, w, label="enc %")
        ax.bar(x + w, dec_pct, w, label="dec %")
        ax.set_xticks(x)
        ax.set_xticklabels(["ONNX", "meljs"])
        ax.set_ylabel("Mean share of total (%)")
        ax.set_title("Mean stage share of total time (matched)")
        ax.legend()
        ax.grid(True, alpha=0.3, axis="y")
        fig.savefig(FIGURES_DIR / "E_bottleneck_stage_share.png", dpi=120, bbox_inches="tight")
        plt.close(fig)

    # --- Write deliverables ---
    matched_clean.to_csv(OUT_DIR / "matched_table.csv", index=False)
    with open(OUT_DIR / "stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    # Summary
    meljs_improves_rtfx = agg["delta_rtfx"]["mean"] > 0
    conclusion_rtfx = "meljs improves final RTFx on average" if meljs_improves_rtfx else "meljs hurts final RTFx on average"
    pre_share_onnx = matched_clean["pre_pct_onnx"].mean()
    pre_share_meljs = matched_clean["pre_pct_meljs"].mean()
    bottleneck_shift = "Preprocess share is lower with meljs (bottleneck shifts toward encoder/decoder)." if pre_share_meljs < pre_share_onnx else "Preprocess share is similar or higher with meljs."
    enc_dec_note = "Encoder/decoder deltas are non-zero; meljs run shows different enc/dec timings (worker/parallel may affect scheduling)." if (abs(agg["delta_enc_ms"]["mean"]) > 1 or abs(agg["delta_dec_ms"]["mean"]) > 1) else "Encoder/decoder deltas are small; meljs mainly affects preprocess."

    summary_lines = [
        "# Metrics analysis: ONNX vs meljs preprocessor (matched samples only)",
        "",
        "## Conclusions",
        f"- **RTFx:** {conclusion_rtfx} (mean delta_rtfx = {agg['delta_rtfx']['mean']:.3f}).",
        f"- **Bottleneck:** {bottleneck_shift}",
        f"- **Encoder/decoder:** {enc_dec_note}",
        "",
        "## Key numbers",
        f"- Matched samples: {agg['n_matched']}",
        f"- Delta RTFx: mean={agg['delta_rtfx']['mean']:.3f}, median={agg['delta_rtfx']['median']:.3f}, p90={agg['delta_rtfx']['p90']:.3f}",
        f"- Delta total_ms: mean={agg['delta_total_ms']['mean']:.1f}, median={agg['delta_total_ms']['median']:.1f}",
        f"- Worst RTFx ONNX: {agg['worst_rtfx_onnx']:.2f}x, meljs: {agg['worst_rtfx_meljs']:.2f}x",
        f"- Biggest RTFx regression (min delta_rtfx): {agg['biggest_rtfx_regression']:.3f}",
        f"- Biggest RTFx improvement (max delta_rtfx): {agg['biggest_rtfx_improvement']:.3f}",
        "",
        "## Figures",
        "- `figures/A_duration_vs_rtfx.png`: Duration vs RTFx (overlay ONNX vs meljs)",
        "- `figures/B_duration_vs_stages_onnx.png`, `B_duration_vs_stages_meljs.png`: Duration vs stage times per mode",
        "- `figures/C_duration_vs_delta_rtfx.png`: Duration vs delta RTFx",
        "- `figures/D_rtfx_distributions.png`: RTFx and delta RTFx histograms",
        "- `figures/E_bottleneck_stage_share.png`: Mean stage share (%) per mode",
        "",
        "## What to log next (actionable)",
        "- Stage start/end timestamps (to detect waiting/overlap).",
        "- Worker queue / postMessage latency (meljs).",
        "- Warmup vs steady-state separation (e.g. first N samples flagged).",
        "- Explicit total time definition (wall-clock) if not already present.",
    ]
    (OUT_DIR / "summary.md").write_text("\n".join(summary_lines), encoding="utf-8")

    print("Done. Outputs in", OUT_DIR)
    print("  summary.md, matched_table.csv, stats.json, figures/*.png")


if __name__ == "__main__":
    main()
