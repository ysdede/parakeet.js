import json
import numpy as np
import pandas as pd
from pathlib import Path
from analyze_logs import load_log, build_matched, derived_and_deltas

METRICS_DIR = Path(__file__).resolve().parent
ONNX_LOG = METRICS_DIR / "ysdede.github.io-1771680286452--onnx-preprocessor--v2-encoder-32-decoder-wasm-8.log"
MELJS_LOG = METRICS_DIR / "ysdede.github.io-1771680737564-meljs-preprocessor--v2-encoder-32-decoder-wasm-8.log"
OUT_DIR = METRICS_DIR / "analysis_out"

def compute_binned_stats(onnx_df: pd.DataFrame, meljs_df: pd.DataFrame, num_bins=10):
    """
    Computes binned statistics based on quantiles of duration for both datasets.
    """
    # Combine durations to find common bin edges
    all_durations = pd.concat([onnx_df['duration_s'], meljs_df['duration_s']])
    bins = np.percentile(all_durations.dropna(), np.linspace(0, 100, num_bins + 1))
    bins[0] -= 0.001 # To include minimum value
    
    onnx_df = onnx_df.copy()
    meljs_df = meljs_df.copy()
    
    onnx_df['bin'] = pd.cut(onnx_df['duration_s'], bins)
    meljs_df['bin'] = pd.cut(meljs_df['duration_s'], bins)
    
    binned_stats = []
    
    for b in onnx_df['bin'].cat.categories:
        o_bin = onnx_df[onnx_df['bin'] == b]
        m_bin = meljs_df[meljs_df['bin'] == b]
        
        o_rtfx_mean = o_bin['rtfx_total'].mean()
        o_rtfx_median = o_bin['rtfx_total'].median()
        m_rtfx_mean = m_bin['rtfx_total'].mean()
        m_rtfx_median = m_bin['rtfx_total'].median()
        
        o_pre_mean = o_bin['preprocess_ms'].mean()
        m_pre_mean = m_bin['preprocess_ms'].mean()
        o_enc_mean = o_bin['encoder_ms'].mean()
        m_enc_mean = m_bin['encoder_ms'].mean()
        o_dec_mean = o_bin['decoder_ms'].mean()
        m_dec_mean = m_bin['decoder_ms'].mean()
        
        # Bottleneck shares per bin
        def mean_share(df, stage_col, total_col):
            t = df[total_col].replace(0, np.nan)
            return (100 * df[stage_col] / t).mean()
            
        o_pre_pct = mean_share(o_bin, 'preprocess_ms', 'total_ms')
        m_pre_pct = mean_share(m_bin, 'preprocess_ms', 'total_ms')
        o_enc_pct = mean_share(o_bin, 'encoder_ms', 'total_ms')
        m_enc_pct = mean_share(m_bin, 'encoder_ms', 'total_ms')
        o_dec_pct = mean_share(o_bin, 'decoder_ms', 'total_ms')
        m_dec_pct = mean_share(m_bin, 'decoder_ms', 'total_ms')
        
        binned_stats.append({
            "bin_label": f"{b.left:.2f}s - {b.right:.2f}s",
            "bin_min_s": b.left,
            "bin_max_s": b.right,
            "count_onnx": len(o_bin),
            "count_meljs": len(m_bin),
            "rtfx_mean_onnx": o_rtfx_mean,
            "rtfx_median_onnx": o_rtfx_median,
            "rtfx_mean_meljs": m_rtfx_mean,
            "rtfx_median_meljs": m_rtfx_median,
            "pre_ms_mean_onnx": o_pre_mean,
            "pre_ms_mean_meljs": m_pre_mean,
            "enc_ms_mean_onnx": o_enc_mean,
            "enc_ms_mean_meljs": m_enc_mean,
            "dec_ms_mean_onnx": o_dec_mean,
            "dec_ms_mean_meljs": m_dec_mean,
            "pre_pct_onnx": o_pre_pct,
            "pre_pct_meljs": m_pre_pct,
            "enc_pct_onnx": o_enc_pct,
            "enc_pct_meljs": m_enc_pct,
            "dec_pct_onnx": o_dec_pct,
            "dec_pct_meljs": m_dec_pct,
        })
        
    return pd.DataFrame(binned_stats)

def setup_html():
    pass # we will manually write the HTML file, the JS just injects the data

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Loading ONNX logs...")
    onnx_df = load_log(ONNX_LOG, "onnx")
    print("Loading meljs logs...")
    meljs_df = load_log(MELJS_LOG, "meljs")
    
    # EXACT MATCHING
    print("Building matched data...")
    matched = build_matched(onnx_df, meljs_df)
    matched = derived_and_deltas(matched)
    matched_clean = matched.dropna(subset=["rtfx_onnx", "rtfx_meljs", "total_ms_onnx", "total_ms_meljs"])
    
    matched_csv_path = OUT_DIR / "comparison_exact.csv"
    matched_clean.to_csv(matched_csv_path, index=False)
    print(f"Saved: {matched_csv_path}")
    
    # BINNING
    print("Building binned data...")
    binned_df = compute_binned_stats(onnx_df, meljs_df, num_bins=8)
    binned_csv_path = OUT_DIR / "comparison_binned.csv"
    binned_df.to_csv(binned_csv_path, index=False)
    print(f"Saved: {binned_csv_path}")
    
    # Save standalone JSON for frontend
    def sanitize(df):
        df = df.replace([np.inf, -np.inf], None)
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    dashboard_data = {
        "dataset_onnx": sanitize(onnx_df),
        "dataset_meljs": sanitize(meljs_df),
        "comparison_exact": sanitize(matched_clean),
        "comparison_binned": sanitize(binned_df),
    }

    data_js_path = OUT_DIR / "data.js"
    with open(data_js_path, "w", encoding="utf-8") as f:
        f.write("window.DASHBOARD_DATA = " + json.dumps(dashboard_data) + ";\n")
    print(f"Saved: {data_js_path}")

    # Generate a clean, Agent-compatible JSON with aggregates
    results_json_path = OUT_DIR / "results.json"
    agg_stats = {
        "summary": {
            "onnx_mean_rtfx": round(float(onnx_df["rtfx_total"].mean()), 2),
            "meljs_mean_rtfx": round(float(meljs_df["rtfx_total"].mean()), 2),
            "meljs_rtfx_improvement_pct": round(float(((meljs_df["rtfx_total"].mean() / onnx_df["rtfx_total"].mean()) - 1) * 100), 2),
            "onnx_mean_preproc_ms": round(float(onnx_df["preprocess_ms"].mean()), 2),
            "meljs_mean_preproc_ms": round(float(meljs_df["preprocess_ms"].mean()), 2)
        },
        "metrics": dashboard_data
    }
    with open(results_json_path, "w", encoding="utf-8") as f:
        json.dump(agg_stats, f, indent=2)
    print(f"Saved: {results_json_path}")

    # Generate an ultra-clean, numeric-only agent summary
    def round_dict_floats(d):
        if isinstance(d, dict):
            return {k: round_dict_floats(v) for k, v in d.items()}
        elif isinstance(d, list):
            return [round_dict_floats(x) for x in d]
        elif isinstance(d, float):
            return round(d, 2)
        return d
    
    agent_summary_path = OUT_DIR / "agent_summary.json"
    clean_binned = round_dict_floats(sanitize(binned_df))
    clean_exact = round_dict_floats(sanitize(matched_clean))
    
    # Strip long strings from exact matches to save tokens for agents
    for row in clean_exact:
        row.pop("reference", None) 
        row.pop("audio_id", None)
        
    ultra_clean_stats = {
        "top_level_summary": agg_stats["summary"],
        "binned_comparisons": clean_binned,
        "exact_matches_numeric_only": clean_exact
    }
    
    with open(agent_summary_path, "w", encoding="utf-8") as f:
        json.dump(ultra_clean_stats, f, indent=2)
    print(f"Saved: {agent_summary_path}")

if __name__ == "__main__":

    main()
