# BoncukJS v3.0 - Streaming Transcription Architecture

**Status:** REVISED (Feb 2026)
**Reason:** Original "State-Preserving Streaming" approach failed with ONNX Runtime Web

---

## Executive Summary

After extensive investigation, we discovered that NVIDIA's "State-Preserving Streaming" approach 
(decoder state continuation between non-overlapping chunks) **does not work** with ONNX Runtime Web 
because:

1. **Encoder is NOT incremental** - Adding new audio frames changes ALL encoder outputs (self-attention)
2. **No KV-cache in ONNX export** - Conformer attention caches are not exported
3. **Decoder state becomes invalid** - When encoder outputs change, saved decoder state is meaningless

**Solution:** A hybrid approach combining:
- **Token-Level Local Agreement** (improved from user's proven merging approach)
- **Frame-Aligned Streaming** (new capability added to parakeet.js)
- **Mel Feature Caching** (10-15% compute savings)
- **Sentence-Context Windows** (retranscribe with context so model produces correct caps/punct)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BONCUKJS v3.0 STREAMING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUDIO CAPTURE LAYER                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  AudioWorkletProcessor → Ring Buffer → Energy Gating → VAD             │   │
│  │                                                                         │   │
│  │  • 16kHz mono PCM                                                       │   │
│  │  • Frame-aligned chunks (40/80/120ms based on sample rate)             │   │
│  │  • Pre-VAD: Energy gating (RMS threshold)                              │   │
│  │  • Post-VAD: Optional ML-based (Silero/TenVAD) - deferred to MVP+      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      MEL FEATURE CACHE LAYER                            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  MelFeatureCache (LRU)                                                  │   │
│  │                                                                         │   │
│  │  • Mel computation is STATELESS - identical audio = identical features │   │
│  │  • Cache mel frames for unchanged audio regions                        │   │
│  │  • Only compute mel for NEW audio (10-15% savings)                     │   │
│  │  • Hash-based key: audio length + sampled values                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       TRANSCRIPTION LAYER                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  parakeet.js with Frame-Aligned Output                                  │   │
│  │                                                                         │   │
│  │  Output per chunk:                                                      │   │
│  │  {                                                                      │   │
│  │    tokenIds:     [423, 891, 102, ...],     // Raw token IDs            │   │
│  │    frameIndices: [13, 21, 28, ...],        // Which encoder frame      │   │
│  │    logProbs:     [-0.05, -0.02, ...],      // Confidence per token     │   │
│  │    tdtSteps:     [3, 2, 4, ...],           // Duration predictions     │   │
│  │    timestamps:   [[0.52, 0.84], ...],      // [start, end] per token   │   │
│  │  }                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TOKEN-LEVEL MERGE LAYER                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  FrameAlignedMerger + LocalAgreementPolicy                              │   │
│  │                                                                         │   │
│  │  1. Compare tokens by (tokenId, absoluteTimestamp) - NOT by text       │   │
│  │  2. Track stability counters - confirm tokens in 2+ consecutive chunks │   │
│  │  3. Use log probabilities for confidence voting                        │   │
│  │  4. Find anchor points in overlap regions                              │   │
│  │  5. Promote stable tokens to "confirmed" state                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MODEL OUTPUT (No Post-Processing)                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  The Parakeet model already outputs proper caps & punctuation!          │   │
│  │                                                                         │   │
│  │  Key: Retranscribe with SENTENCE CONTEXT (last 2-3 sentences)          │   │
│  │       so model has enough context to produce correct formatting.        │   │
│  │                                                                         │   │
│  │  NO post-processing needed - just merge and display model output.      │   │
│  │                                                                         │   │
│  │  Model output: "How are you today? I am fine."                         │   │
│  │  We display:   "How are you today? I am fine."  (as-is)                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         UI LAYER (SolidJS)                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  • Real-time waveform visualization                                    │   │
│  │  • Confirmed text (stable) vs Pending text (gray/italic)               │   │
│  │  • Privacy badge ("Audio never leaves device")                         │   │
│  │  • Model loading progress                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Why NOT State-Preserving Streaming?

| Requirement | NVIDIA Approach | ONNX Reality |
|-------------|-----------------|--------------|
| Incremental Encoder | Required | ❌ Not available |
| Decoder State Valid | Requires same encoder | ❌ Encoder outputs change |
| KV-Cache | Needed for context | ❌ Not exported |

**Conclusion:** State-preserving only works in PyTorch with full model access, not with ONNX exports.

### 2. Why Token-Level Merging (Not Text)?

| Aspect | Text Merging | Token-Level Merging |
|--------|--------------|---------------------|
| Alignment | Fuzzy string match | Exact token ID match |
| Timing | Word boundaries | Frame-precise (80ms) |
| Confidence | Word-level avg | Per-token log-prob |
| Edge cases | "Hello" vs "hello" | Same token ID |

### 3. Why Two-Stage Pipeline?

**Problem:** Short audio chunks lack context for proper capitalization/punctuation.

**Solution:** Separate concerns:
- **Stage 1 (Acoustic):** What tokens are spoken? (model does this well)
- **Stage 2 (Formatting):** How to write them? (deterministic rules work better)

---

## Streaming Strategies

### Strategy A: Minimal Overlap (Recommended for Low Latency)

```
Chunk size: 5-7 seconds
Overlap: 2 seconds at each end
Effective new audio: 3-5 seconds per chunk

Timeline:
  Chunk 1: [0s ─────── 7s]
  Chunk 2:      [5s ─────── 12s]
  Chunk 3:           [10s ─────── 17s]
                ▲▲▲▲  ▲▲▲▲  ▲▲▲▲
                Overlap regions for anchor matching
```

**Pros:** Low latency (~3-5s), moderate compute
**Cons:** May miss context for complex sentences

### Strategy B: Sentence-Context Window (Your Current Approach)

```
Window: Last 2-3 sentences + new audio
Typical size: 8-30 seconds
Retranscribe entire window each iteration

Timeline:
  Iteration 1: [0s ─────────────────── 10s]
  Iteration 2: [0s ─────────────────────── 12s]  (same start, extended)
  Iteration 3: [5s ─────────────────────── 14s]  (window slides)
                ▲                      ▲
                Sentence boundary      New audio end
```

**Pros:** Maximum context, best capitalization/punctuation
**Cons:** Higher compute (re-encode same audio)

### Strategy C: Hybrid (Best of Both)

```
1. Use Strategy A for initial fast transcription (low latency)
2. Use Strategy B for "polishing" after speech pause detected
3. Only retranscribe long context when needed for formatting

Timeline:
  Fast path: 5s chunks → immediate tokens (no formatting)
  Polish path: On pause → retranscribe last 2 sentences with context
```

**Pros:** Low latency + good formatting
**Cons:** More complex implementation

---

## Implementation Components

### 1. MelFeatureCache (Already Implemented in parakeet.js)

```javascript
import { MelFeatureCache } from 'parakeet.js';

const melCache = new MelFeatureCache({ maxCacheSizeMB: 50 });

// Cached mel computation
const { features, T, melBins, cached } = await melCache.getFeatures(model, audio);
console.log(`Mel cache ${cached ? 'HIT' : 'MISS'}`);
```

**Savings:** 10-15% when retranscribing overlapping regions.

### 2. Frame-Aligned Transcription (Already Implemented in parakeet.js)

```javascript
const result = await model.transcribe(audio, 16000, {
  returnTimestamps: true,
  returnTokenIds: true,
  returnFrameIndices: true,  // NEW: encoder frame per token
  returnLogProbs: true,      // NEW: confidence per token
  returnTdtSteps: true,      // NEW: duration prediction
  timeOffset: chunkStartTime
});

// result.frameIndices = [13, 21, 28, ...]  (which encoder frame)
// result.logProbs = [-0.05, -0.02, ...]    (log probability)
```

### 3. FrameAlignedMerger (Already Implemented in parakeet.js)

```javascript
import { FrameAlignedMerger } from 'parakeet.js';

const merger = new FrameAlignedMerger({
  frameTimeStride: model.getFrameTimeStride(),  // 0.08s
  timeTolerance: 0.2,                           // 200ms matching window
  stabilityThreshold: 2                         // Confirm after 2 appearances
});

// Process each chunk
const merged = merger.processChunk(result, chunkStartTime, overlapDuration);
console.log(`Confirmed: ${merged.confirmed.length}, Pending: ${merged.pending.length}`);
```

### 4. TokenStreamTranscriber (TO IMPLEMENT in BoncukJS)

```javascript
// src/lib/transcription/TokenStreamTranscriber.ts
export class TokenStreamTranscriber {
  private model: ParakeetModel;
  private merger: FrameAlignedMerger;
  private melCache: MelFeatureCache;
  private formatter: DelayedTextFormatter;
  
  // Configuration
  private chunkDuration = 5.0;      // seconds
  private overlapDuration = 2.0;    // seconds
  
  async processAudioChunk(audio: Float32Array, timestamp: number): Promise<TranscriptionUpdate> {
    // 1. Get mel features (cached if possible)
    const { features, cached } = await this.melCache.getFeatures(this.model, audio);
    
    // 2. Transcribe with frame-aligned output
    const result = await this.model.transcribe(audio, 16000, {
      returnTimestamps: true,
      returnTokenIds: true,
      returnFrameIndices: true,
      returnLogProbs: true,
      timeOffset: timestamp
    });
    
    // 3. Merge with previous tokens
    const merged = this.merger.processChunk(result, timestamp, this.overlapDuration);
    
    // 4. Format confirmed tokens
    const confirmedText = this.formatter.format(merged.confirmed);
    const pendingText = this.formatter.formatPending(merged.pending);
    
    return {
      confirmed: confirmedText,
      pending: pendingText,
      full: confirmedText + (pendingText ? ' ' + pendingText : ''),
      stats: {
        melCacheHit: cached,
        confirmedTokens: merged.confirmed.length,
        pendingTokens: merged.pending.length,
        anchorsFound: merged.anchorsFound
      }
    };
  }
}
```

### 5. DelayedTextFormatter (TO IMPLEMENT in BoncukJS)

```javascript
// src/lib/transcription/DelayedTextFormatter.ts
export class DelayedTextFormatter {
  // Sentence boundary detection
  private sentenceEnders = /[.!?]/;
  private abbreviations = ['mr', 'mrs', 'dr', 'ms', 'prof'];
  
  // Silence-based punctuation
  private pauseThresholds = {
    comma: 0.3,     // 300ms pause → might be comma
    period: 0.7,    // 700ms pause → likely sentence end
    paragraph: 2.0  // 2s pause → paragraph break
  };
  
  format(tokens: ConfirmedToken[]): string {
    // 1. Convert token IDs to text
    let text = tokens.map(t => t.text).join('');
    
    // 2. Detect sentence boundaries from silence gaps
    const sentences = this.detectSentences(tokens);
    
    // 3. Apply capitalization
    text = this.applyCapitalization(text, sentences);
    
    // 4. Insert punctuation based on pauses
    text = this.insertPunctuation(tokens, text);
    
    return text;
  }
  
  private detectSentences(tokens: ConfirmedToken[]): SentenceBoundary[] {
    const boundaries: SentenceBoundary[] = [];
    
    for (let i = 1; i < tokens.length; i++) {
      const gap = tokens[i].absTime - tokens[i-1].absTime;
      
      if (gap >= this.pauseThresholds.period) {
        boundaries.push({
          afterTokenIndex: i - 1,
          confidence: gap >= this.pauseThresholds.paragraph ? 'high' : 'medium'
        });
      }
    }
    
    return boundaries;
  }
}
```

---

## Performance Estimates

### Without Optimizations (Baseline)

| Operation | Time | Notes |
|-----------|------|-------|
| Mel computation | ~50ms | Per chunk |
| Encoder | ~200ms | Full audio |
| Decoder | ~150ms | All frames |
| **Total** | **~400ms** | For 5s chunk |

### With Optimizations

| Operation | Time | Savings |
|-----------|------|---------|
| Mel computation | ~10ms | 80% (cache hit) |
| Encoder | ~200ms | 0% (unavoidable) |
| Decoder | ~150ms | 0% (unavoidable) |
| **Total** | **~360ms** | 10% overall |

**Note:** The main savings come from:
1. **Simpler merging logic** (token-level vs text alignment)
2. **Mel caching** when retranscribing overlapping regions
3. **Better accuracy** (fewer correction iterations needed)

---

## Implementation Phases

### Phase 1: Core Infrastructure (Current)
- [x] Add frame-aligned output to parakeet.js (`returnFrameIndices`, `returnLogProbs`)
- [x] Add `MelFeatureCache` to parakeet.js
- [x] Add `FrameAlignedMerger` to parakeet.js
- [ ] Create `TokenStreamTranscriber` in BoncukJS
- [ ] Create `DelayedTextFormatter` in BoncukJS

### Phase 2: Integration
- [ ] Wire up Audio Capture → TokenStreamTranscriber
- [ ] Implement UI for confirmed vs pending text
- [ ] Add real-time waveform visualization
- [ ] Test with various audio inputs

### Phase 3: Optimization
- [ ] Tune stability thresholds
- [ ] Optimize time tolerance for different speaking speeds
- [ ] Add adaptive chunk sizing based on speech rate
- [ ] Implement Strategy C (Hybrid) for best latency/quality

### Phase 4: Polish
- [ ] Add sentence boundary detection library
- [ ] Improve punctuation insertion rules
- [ ] Add speaker diarization (if multiple speakers)
- [ ] PWA offline support

---

## Configuration Recommendations

```javascript
// Recommended defaults for different use cases

// Low latency (live captioning)
const lowLatencyConfig = {
  chunkDuration: 3.0,
  overlapDuration: 1.0,
  stabilityThreshold: 1,  // Accept quickly
  timeTolerance: 0.3
};

// Balanced (general transcription)
const balancedConfig = {
  chunkDuration: 5.0,
  overlapDuration: 2.0,
  stabilityThreshold: 2,
  timeTolerance: 0.2
};

// High accuracy (dictation)
const highAccuracyConfig = {
  chunkDuration: 7.0,
  overlapDuration: 3.0,
  stabilityThreshold: 3,  // Wait for more confirmation
  timeTolerance: 0.15
};
```

---

## Summary

### What Works
1. **Token-level merging** using frame indices and timestamps
2. **Mel caching** for overlapping regions
3. **Stability tracking** to confirm tokens across chunks
4. **Delayed formatting** for capitalization and punctuation

### What Doesn't Work
1. ❌ State-preserving streaming (ONNX limitation)
2. ❌ Encoder output caching (self-attention changes all)
3. ❌ Decoder state continuation (invalid when encoder changes)

### Key Insight
> The model is good at **acoustic recognition** (what sounds are spoken).
> We handle **text formatting** (how to write it) separately with deterministic rules.
> This separation allows short chunks for low latency while maintaining quality.
