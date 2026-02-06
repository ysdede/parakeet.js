#!/usr/bin/env python3
"""
Generate reference mel features for validating the pure JS mel implementation.

This script:
1. Generates a deterministic test signal (mix of sine waves)
2. Runs it through the ONNX nemo128 preprocessor (the ground truth)
3. Also exports the mel filterbank matrix for separate validation
4. Saves everything as JSON with base64-encoded float32 arrays

Usage:
    conda activate asrds_py311
    cd N:\github\ysdede\parakeet.js
    python tests/generate_mel_reference.py

Requirements:
    pip install onnxruntime numpy torchaudio huggingface_hub
"""

import argparse
import base64
import json
import sys
from pathlib import Path

import numpy as np


def float32_to_base64(arr: np.ndarray) -> str:
    """Encode float32 array as base64 string."""
    return base64.b64encode(arr.astype(np.float32).tobytes()).decode("ascii")


def float64_to_base64(arr: np.ndarray) -> str:
    """Encode float64 array as base64 string."""
    return base64.b64encode(arr.astype(np.float64).tobytes()).decode("ascii")


def generate_test_signals():
    """Generate deterministic test audio signals."""
    signals = {}

    # Test 1: Mix of sine waves (2 seconds)
    N = 32000  # 2s at 16kHz
    t = np.arange(N, dtype=np.float64) / 16000.0
    audio = (
        0.5 * np.sin(2 * np.pi * 440 * t)
        + 0.3 * np.sin(2 * np.pi * 1000 * t)
        + 0.1 * np.sin(2 * np.pi * 3000 * t)
    ).astype(np.float32)
    signals["sine_mix_2s"] = audio

    # Test 2: Short signal (0.5 seconds)
    N2 = 8000
    t2 = np.arange(N2, dtype=np.float64) / 16000.0
    audio2 = (0.7 * np.sin(2 * np.pi * 261.63 * t2)).astype(np.float32)  # Middle C
    signals["sine_short_0.5s"] = audio2

    # Test 3: White noise-like (deterministic PRNG)
    rng = np.random.RandomState(42)
    audio3 = rng.randn(16000).astype(np.float32) * 0.3  # 1s
    signals["noise_1s"] = audio3

    # Test 4: 5 seconds (typical streaming window)
    N4 = 80000
    t4 = np.arange(N4, dtype=np.float64) / 16000.0
    audio4 = (
        0.4 * np.sin(2 * np.pi * 440 * t4)
        + 0.2 * np.sin(2 * np.pi * 880 * t4)
        + 0.15 * np.sin(2 * np.pi * 1320 * t4)
        + 0.1 * np.sin(2 * np.pi * 2000 * t4)
    ).astype(np.float32)
    signals["sine_mix_5s"] = audio4

    return signals


def get_nemo128_onnx_path():
    """Download nemo128.onnx from HuggingFace or use local copy."""
    # Try local onnx-asr built models first
    local_paths = [
        Path(__file__).parent.parent.parent
        / "onnx-asr"
        / "src"
        / "onnx_asr"
        / "preprocessors"
        / "data"
        / "nemo128.onnx",
    ]
    for p in local_paths:
        if p.exists():
            print(f"Using local nemo128.onnx: {p}")
            return str(p)

    # Download from HuggingFace
    try:
        from huggingface_hub import hf_hub_download

        path = hf_hub_download("istupakov/parakeet-tdt-0.6b-v2-onnx", "nemo128.onnx")
        print(f"Downloaded nemo128.onnx from HuggingFace: {path}")
        return path
    except Exception as e:
        print(f"Failed to get nemo128.onnx: {e}")
        sys.exit(1)


def run_onnx_preprocessor(audio: np.ndarray, onnx_path: str):
    """Run ONNX nemo128 preprocessor on audio."""
    import onnxruntime as ort

    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    waveforms = audio[np.newaxis, :].astype(np.float32)  # [1, N]
    waveforms_lens = np.array([len(audio)], dtype=np.int64)  # [1]

    features, features_lens = session.run(
        ["features", "features_lens"],
        {"waveforms": waveforms, "waveforms_lens": waveforms_lens},
    )

    return features, int(features_lens[0])


def get_mel_filterbank():
    """Get the exact mel filterbank matrix used by torchaudio."""
    import torchaudio

    fb = torchaudio.functional.melscale_fbanks(
        n_freqs=257,  # n_fft // 2 + 1
        f_min=0,
        f_max=8000,  # sample_rate // 2
        n_mels=128,
        sample_rate=16000,
        norm="slaney",
        mel_scale="slaney",
    )
    return fb.numpy()  # [257, 128]


def main():
    parser = argparse.ArgumentParser(
        description="Generate mel feature reference for JS validation"
    )
    parser.add_argument(
        "--output",
        default="tests/mel_reference.json",
        help="Output JSON path",
    )
    parser.add_argument(
        "--include-filterbank",
        action="store_true",
        default=True,
        help="Include mel filterbank matrix in output",
    )
    args = parser.parse_args()

    # Get ONNX model
    onnx_path = get_nemo128_onnx_path()

    # Generate test signals
    print("\nGenerating test signals...")
    signals = generate_test_signals()

    # Run ONNX preprocessor on each
    print("\nRunning ONNX preprocessor...")
    results = {}
    for name, audio in signals.items():
        print(f"  Processing '{name}': {len(audio)} samples ({len(audio)/16000:.2f}s)")
        features, features_len = run_onnx_preprocessor(audio, onnx_path)
        print(
            f"    → features shape: {features.shape}, valid frames: {features_len}"
        )

        results[name] = {
            "audio": float32_to_base64(audio),
            "audioLength": len(audio),
            "features": float32_to_base64(features.flatten()),
            "featuresShape": list(features.shape),
            "featuresLen": features_len,
            # Also save some raw values for quick sanity checks
            "featuresFirst10": features.flatten()[:10].tolist(),
            "featuresLast10": features.flatten()[-10:].tolist(),
            "featuresMean": float(features[:, :, :features_len].mean()),
            "featuresStd": float(features[:, :, :features_len].std()),
        }

    # Get mel filterbank for separate validation
    filterbank_data = None
    if args.include_filterbank:
        print("\nExporting mel filterbank matrix...")
        try:
            fb = get_mel_filterbank()
            print(f"  Filterbank shape: {fb.shape}")
            filterbank_data = {
                "data": float32_to_base64(fb.flatten()),
                "shape": list(fb.shape),
                "first10": fb.flatten()[:10].tolist(),
            }
        except ImportError:
            print("  torchaudio not available, skipping filterbank export")

    # Assemble output
    output = {
        "version": "1.0",
        "nMels": 128,
        "nFft": 512,
        "hopLength": 160,
        "winLength": 400,
        "preemph": 0.97,
        "sampleRate": 16000,
        "onnxModel": onnx_path,
        "tests": results,
    }
    if filterbank_data:
        output["melFilterbank"] = filterbank_data

    # Save
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"\nReference data saved to: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

    # Print summary
    print("\n=== Summary ===")
    for name, r in results.items():
        print(
            f"  {name}: {r['audioLength']} samples → "
            f"{r['featuresShape']} features, {r['featuresLen']} valid frames"
        )
        print(f"    mean={r['featuresMean']:.6f}, std={r['featuresStd']:.6f}")


if __name__ == "__main__":
    main()
