#!/usr/bin/env python3
"""
Python reference script for comparing parakeet.js output against onnx-asr.

This script uses the onnx-asr library to generate reference transcriptions
and intermediate outputs for validation of the JavaScript implementation.

Usage:
    conda activate asrds_py311
    cd N:\github\ysdede\parakeet.js
    pip install -e N:\github\ysdede\onnx-asr[cpu,hub]
    python tests/python_reference.py --audio audio/-PjpQgMen3x4N7AEaDI8y.wav
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np

# Add onnx-asr to path if not installed
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "onnx-asr" / "src"))


def load_audio(audio_path: str, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    """Load audio file and resample to target sample rate."""
    try:
        import soundfile as sf
        audio, sr = sf.read(audio_path)
        if sr != target_sr:
            # Simple linear resampling (for testing purposes)
            from scipy import signal
            audio = signal.resample(audio, int(len(audio) * target_sr / sr))
            sr = target_sr
        return audio.astype(np.float32), sr
    except ImportError:
        print("soundfile not available, trying scipy.io.wavfile")
        from scipy.io import wavfile
        sr, audio = wavfile.read(audio_path)
        if audio.dtype == np.int16:
            audio = audio.astype(np.float32) / 32768.0
        elif audio.dtype == np.int32:
            audio = audio.astype(np.float32) / 2147483648.0
        return audio, sr


def transcribe_with_onnx_asr(audio_path: str, model_name: str = "istupakov/parakeet-tdt-0.6b-v2-onnx") -> dict:
    """
    Transcribe audio using onnx-asr and return detailed output for comparison.
    """
    from onnx_asr import Asr
    
    print(f"Loading model: {model_name}")
    asr = Asr.from_pretrained(model_name)
    
    print(f"Loading audio: {audio_path}")
    audio, sr = load_audio(audio_path)
    
    # Ensure mono
    if len(audio.shape) > 1:
        audio = audio.mean(axis=1)
    
    print(f"Audio shape: {audio.shape}, sample rate: {sr}")
    
    # Prepare batch input
    waveforms = audio[np.newaxis, :]  # Add batch dimension [1, N]
    waveforms_lens = np.array([len(audio)], dtype=np.int64)
    
    print("Running inference...")
    results = list(asr.recognize_batch(waveforms, waveforms_lens, need_logprobs=True))
    
    if not results:
        return {"error": "No results returned"}
    
    result = results[0]
    
    output = {
        "text": result.text,
        "tokens": result.tokens,
        "timestamps": result.timestamps,
        "logprobs": result.logprobs,
        "model": model_name,
        "audio_path": str(audio_path),
        "audio_length_samples": len(audio),
        "audio_duration_s": len(audio) / sr,
    }
    
    print(f"\nTranscription: {result.text}")
    print(f"Token count: {len(result.tokens) if result.tokens else 0}")
    
    return output


def transcribe_with_debug(audio_path: str, model_name: str = "istupakov/parakeet-tdt-0.6b-v2-onnx") -> dict:
    """
    Transcribe with detailed debug output to compare decoder state handling.
    """
    import onnxruntime as rt
    from huggingface_hub import hf_hub_download
    
    print(f"Loading model files from: {model_name}")
    
    # Download model files (including external data)
    encoder_path = hf_hub_download(model_name, "encoder-model.onnx")
    try:
        # Download external data file if it exists
        hf_hub_download(model_name, "encoder-model.onnx.data")
    except Exception:
        pass  # External data may not exist for all models
    
    decoder_path = hf_hub_download(model_name, "decoder_joint-model.onnx")
    try:
        hf_hub_download(model_name, "decoder_joint-model.onnx.data")
    except Exception:
        pass
    
    vocab_path = hf_hub_download(model_name, "vocab.txt")
    preprocessor_path = hf_hub_download(model_name, "nemo128.onnx")
    
    # Load vocab
    vocab = {}
    blank_idx = None
    with open(vocab_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split(" ")
            if len(parts) == 2:
                token, idx = parts
                idx = int(idx)
                vocab[idx] = token.replace("\u2581", " ")
                if token == "<blk>":
                    blank_idx = idx
    
    vocab_size = len(vocab)
    print(f"Vocab size: {vocab_size}, blank_idx: {blank_idx}")
    
    # Load audio
    audio, sr = load_audio(audio_path)
    if len(audio.shape) > 1:
        audio = audio.mean(axis=1)
    
    # Load sessions
    preprocessor = rt.InferenceSession(preprocessor_path)
    encoder = rt.InferenceSession(encoder_path)
    decoder_joint = rt.InferenceSession(decoder_path)
    
    # Get state shapes from decoder
    shapes = {x.name: x.shape for x in decoder_joint.get_inputs()}
    print(f"Decoder input shapes: {shapes}")
    
    # Preprocess
    waveforms = audio[np.newaxis, :].astype(np.float32)
    waveforms_lens = np.array([len(audio)], dtype=np.int64)
    
    features, features_lens = preprocessor.run(
        ["features", "features_lens"],
        {"waveforms": waveforms, "waveforms_lens": waveforms_lens}
    )
    print(f"Features shape: {features.shape}, lens: {features_lens}")
    
    # Encode
    encoder_out, encoder_lens = encoder.run(
        ["outputs", "encoded_lengths"],
        {"audio_signal": features, "length": features_lens}
    )
    print(f"Encoder output shape: {encoder_out.shape}, lens: {encoder_lens}")
    
    # Transpose encoder output [B, D, T] -> [B, T, D]
    encoder_out = encoder_out.transpose(0, 2, 1)
    print(f"Transposed encoder shape: {encoder_out.shape}")
    
    # Initialize decoder state
    state1 = np.zeros((shapes["input_states_1"][0], 1, shapes["input_states_1"][2]), dtype=np.float32)
    state2 = np.zeros((shapes["input_states_2"][0], 1, shapes["input_states_2"][2]), dtype=np.float32)
    
    # Decode frame by frame (matching Python reference logic)
    tokens = []
    timestamps = []
    debug_frames = []
    max_tokens_per_step = 10
    
    t = 0
    emitted_tokens = 0
    prev_state = (state1, state2)
    
    encodings = encoder_out[0]  # [T, D]
    encodings_len = int(encoder_lens[0])
    
    print(f"\nDecoding {encodings_len} frames...")
    
    while t < encodings_len:
        frame = encodings[t]  # [D]
        
        # Run decoder
        outputs, new_state1, new_state2 = decoder_joint.run(
            ["outputs", "output_states_1", "output_states_2"],
            {
                "encoder_outputs": frame[np.newaxis, :, np.newaxis],  # [1, D, 1]
                "targets": [[tokens[-1] if tokens else blank_idx]],
                "target_length": [1],
                "input_states_1": prev_state[0],
                "input_states_2": prev_state[1],
            }
        )
        
        logits = np.squeeze(outputs)
        token_logits = logits[:vocab_size]
        dur_logits = logits[vocab_size:]
        
        token = int(token_logits.argmax())
        step = int(dur_logits.argmax()) if len(dur_logits) > 0 else 0
        
        # Debug info for this frame
        frame_debug = {
            "t": t,
            "token": token,
            "token_str": vocab.get(token, "?"),
            "step": step,
            "is_blank": token == blank_idx,
            "state_updated": False,
        }
        
        if token != blank_idx:
            # CRITICAL: Only update state on non-blank token
            prev_state = (new_state1, new_state2)
            tokens.append(token)
            timestamps.append(t)
            emitted_tokens += 1
            frame_debug["state_updated"] = True
        
        debug_frames.append(frame_debug)
        
        # Frame advancement logic
        if step > 0:
            t += step
            emitted_tokens = 0
        elif token == blank_idx or emitted_tokens >= max_tokens_per_step:
            t += 1
            emitted_tokens = 0
    
    # Decode tokens to text
    text_tokens = [vocab[i] for i in tokens]
    text = "".join(text_tokens).strip()
    
    print(f"\nFinal transcription: {text}")
    print(f"Total tokens: {len(tokens)}")
    
    return {
        "text": text,
        "tokens": tokens,
        "token_strings": text_tokens,
        "timestamps": timestamps,
        "blank_idx": blank_idx,
        "vocab_size": vocab_size,
        "encoder_frames": encodings_len,
        "debug_frames": debug_frames[:50],  # First 50 frames for debugging
    }


def main():
    parser = argparse.ArgumentParser(description="Python reference transcription for parakeet.js comparison")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--model", default="istupakov/parakeet-tdt-0.6b-v2-onnx", help="Model name on HuggingFace Hub")
    parser.add_argument("--output", default="tests/reference_output.json", help="Output JSON path")
    parser.add_argument("--debug", action="store_true", help="Run with detailed debug output")
    
    args = parser.parse_args()
    
    if args.debug:
        result = transcribe_with_debug(args.audio, args.model)
    else:
        result = transcribe_with_onnx_asr(args.audio, args.model)
    
    # Save to JSON
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\nOutput saved to: {output_path}")


if __name__ == "__main__":
    main()
