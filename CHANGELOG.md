# Changelog

This file tracks notable user-facing changes. It is intentionally concise.

## v1.4.3

- Internal hot-path performance work in decode and merge paths.
- No public API changes.

## v1.4.2

- Added `transcribeLongAudio()` for long-form transcription.
- Added `LongAudioTranscribeOptions` and `LongAudioTranscribeResult`.
- Long-form transcription uses sentence-aware chunking and merged output.

## v1.4.0

- Updated the default JS preprocessor path to the `pr74` real-FFT implementation.
- Kept feature compatibility while reducing mel extraction cost.
