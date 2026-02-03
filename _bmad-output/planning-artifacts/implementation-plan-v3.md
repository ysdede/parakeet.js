# BoncukJS v3.0 Implementation Plan

**Date:** Feb 2026
**Based on:** streaming-architecture-v3.md

---

## Overview

This plan implements the revised streaming transcription architecture after discovering 
that NVIDIA's "State-Preserving Streaming" approach doesn't work with ONNX Runtime Web.

### Already Completed (in parakeet.js)
- ✅ `returnFrameIndices` - encoder frame index per token
- ✅ `returnLogProbs` - raw log probabilities per token
- ✅ `returnTdtSteps` - TDT duration predictions per token
- ✅ `MelFeatureCache` - LRU cache for mel spectrograms
- ✅ `FrameAlignedMerger` - token-level merge with stability tracking
- ✅ Helper methods: `getFrameTimeStride()`, `frameToTime()`, `getStreamingConstants()`

### To Implement (in BoncukJS)
- [ ] `TokenStreamTranscriber` - main streaming orchestrator (sentence-context windows)
- [ ] `SentenceBoundaryDetector` - detect sentence ends to define retranscription windows
- [ ] UI integration - confirmed vs pending text display

**Note:** NO post-processing for caps/punctuation. The Parakeet model outputs proper formatting when given sufficient context. We achieve this by retranscribing with sentence-context windows (last 2-3 sentences).

---

## Task Breakdown

### Task 1: TokenStreamTranscriber Class

**File:** `src/lib/transcription/TokenStreamTranscriber.ts`

**Purpose:** Main orchestrator for streaming transcription. Combines audio processing,
transcription, merging, and formatting into a single cohesive API.

```typescript
import { ParakeetModel, MelFeatureCache, FrameAlignedMerger } from 'parakeet.js';
import { DelayedTextFormatter } from './DelayedTextFormatter';

export interface StreamingConfig {
  chunkDuration: number;      // seconds (default: 5.0)
  overlapDuration: number;    // seconds (default: 2.0)
  stabilityThreshold: number; // appearances to confirm (default: 2)
  timeTolerance: number;      // seconds for matching (default: 0.2)
}

export interface TranscriptionUpdate {
  // Text output
  confirmed: string;          // Stable, won't change
  pending: string;            // May still change
  full: string;               // confirmed + pending
  
  // Token-level data (for advanced use)
  confirmedTokens: TokenData[];
  pendingTokens: TokenData[];
  
  // Statistics
  stats: {
    melCacheHit: boolean;
    confirmedCount: number;
    pendingCount: number;
    anchorsFound: number;
    processingTimeMs: number;
  };
}

export interface TokenData {
  id: number;
  text: string;
  absTime: number;
  logProb: number;
  frameIndex: number;
}

export class TokenStreamTranscriber {
  private model: ParakeetModel;
  private merger: FrameAlignedMerger;
  private melCache: MelFeatureCache;
  private formatter: DelayedTextFormatter;
  private config: StreamingConfig;
  
  // State
  private currentTime: number = 0;
  private isProcessing: boolean = false;
  
  constructor(model: ParakeetModel, config: Partial<StreamingConfig> = {}) {
    this.model = model;
    this.config = {
      chunkDuration: config.chunkDuration ?? 5.0,
      overlapDuration: config.overlapDuration ?? 2.0,
      stabilityThreshold: config.stabilityThreshold ?? 2,
      timeTolerance: config.timeTolerance ?? 0.2,
    };
    
    this.merger = new FrameAlignedMerger({
      frameTimeStride: model.getFrameTimeStride(),
      timeTolerance: this.config.timeTolerance,
      stabilityThreshold: this.config.stabilityThreshold,
    });
    
    this.melCache = new MelFeatureCache({ maxCacheSizeMB: 50 });
    this.formatter = new DelayedTextFormatter();
  }
  
  async processChunk(audio: Float32Array, timestamp: number): Promise<TranscriptionUpdate> {
    const startTime = performance.now();
    
    // 1. Transcribe with frame-aligned output
    const result = await this.model.transcribe(audio, 16000, {
      returnTimestamps: true,
      returnTokenIds: true,
      returnFrameIndices: true,
      returnLogProbs: true,
      timeOffset: timestamp,
    });
    
    // 2. Merge with previous tokens
    const merged = this.merger.processChunk(result, timestamp, this.config.overlapDuration);
    
    // 3. Format text
    const confirmedText = this.formatter.format(merged.confirmed);
    const pendingText = this.formatter.formatPending(merged.pending);
    
    this.currentTime = timestamp + audio.length / 16000;
    
    return {
      confirmed: confirmedText,
      pending: pendingText,
      full: confirmedText + (pendingText ? ' ' + pendingText : ''),
      confirmedTokens: merged.confirmed,
      pendingTokens: merged.pending,
      stats: {
        melCacheHit: false, // TODO: integrate mel cache
        confirmedCount: merged.confirmed.length,
        pendingCount: merged.pending.length,
        anchorsFound: merged.anchorsFound,
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
  
  // Get current state
  getState(): { confirmed: string; pending: string; totalTokens: number } {
    return {
      confirmed: this.formatter.format(this.merger.getAllTokens().filter(t => t.confirmed)),
      pending: this.formatter.formatPending(this.merger.getAllTokens().filter(t => !t.confirmed)),
      totalTokens: this.merger.getAllTokens().length,
    };
  }
  
  // Reset for new session
  reset(): void {
    this.merger.reset();
    this.melCache.clear();
    this.currentTime = 0;
  }
}
```

**Acceptance Criteria:**
- [ ] Processes audio chunks and returns TranscriptionUpdate
- [ ] Correctly distinguishes confirmed vs pending tokens
- [ ] Tracks processing time statistics
- [ ] Provides reset functionality

---

### Task 2: SentenceBoundaryDetector Class

**File:** `src/lib/transcription/SentenceBoundaryDetector.ts`

**Purpose:** Detects sentence boundaries in the FINALIZED transcript to determine
the START POINT for the retranscription window. This is NOT for post-processing
formatting - it's for defining WHERE to start the sliding context window.

**Key Insight:** The Parakeet model already outputs proper capitalization and 
punctuation when given sufficient context. We achieve this by retranscribing 
the last 2-3 sentences + new audio. The model sees complete sentences and 
produces correct formatting.

```typescript
export interface SentenceInfo {
  text: string;
  startTime: number;      // Audio timestamp where sentence starts
  endTime: number;        // Audio timestamp where sentence ends
  startSample: number;    // Sample index in audio buffer
  endSample: number;      // Sample index in audio buffer
}

export class SentenceBoundaryDetector {
  private sentences: SentenceInfo[] = [];
  
  /**
   * Update with new finalized transcript from model.
   * Parses punctuation (. ! ?) to find sentence boundaries.
   */
  updateFromTranscript(text: string, words: WordWithTimestamp[]): void {
    // Find sentence-ending punctuation in model output
    // Map back to word timestamps
    // Store sentence boundaries
  }
  
  /**
   * Get the start point for retranscription window.
   * Returns the start of the Nth-to-last sentence.
   * 
   * @param sentencesBack - How many sentences to include (default: 2)
   * @returns Audio timestamp to start retranscription from
   */
  getRetranscriptionStart(sentencesBack: number = 2): number {
    if (this.sentences.length < sentencesBack) {
      return 0; // Not enough sentences, start from beginning
    }
    const targetSentence = this.sentences[this.sentences.length - sentencesBack];
    return targetSentence.startTime;
  }
  
  /**
   * Get the last N sentences for context display.
   */
  getLastSentences(n: number): SentenceInfo[] {
    return this.sentences.slice(-n);
  }
}
      
      // Check for sentence boundary after this word
      if (boundaries.has(i)) {
        const boundary = boundaries.get(i)!;
        result += boundary.punctuation;
        sentenceStart = true;
      }
    }
    
    return result.trim();
  }
  
  /**
   * Format pending tokens (shown in gray, may change).
   */
  formatPending(tokens: TokenData[]): string {
    if (tokens.length === 0) return '';
    // Simple formatting for pending - no punctuation decisions
    return tokens.map(t => t.text).join('').replace(/▁/g, ' ').trim();
  }
  
  private tokensToWords(tokens: TokenData[]): WordWithTiming[] {
    const words: WordWithTiming[] = [];
    let currentWord = '';
    let wordStart = 0;
    let wordEnd = 0;
    
    for (const token of tokens) {
      const text = token.text;
      const isWordStart = text.startsWith('▁') || text.startsWith(' ');
      const cleanText = text.replace(/^[▁\s]+/, '');
      
      if (isWordStart && currentWord) {
        words.push({ text: currentWord, startTime: wordStart, endTime: wordEnd });
        currentWord = cleanText;
        wordStart = token.absTime;
      } else {
        if (!currentWord) wordStart = token.absTime;
        currentWord += cleanText;
      }
      wordEnd = token.absTime;
    }
    
    if (currentWord) {
      words.push({ text: currentWord, startTime: wordStart, endTime: wordEnd });
    }
    
    return words;
  }
  
  private detectSentenceBoundaries(words: WordWithTiming[]): Map<number, SentenceBoundary> {
    const boundaries = new Map<number, SentenceBoundary>();
    
    for (let i = 0; i < words.length - 1; i++) {
      const gap = words[i + 1].startTime - words[i].endTime;
      const word = words[i].text.toLowerCase();
      
      // Check if this word is an abbreviation (don't end sentence)
      if (this.config.abbreviations.includes(word.replace(/\.$/, ''))) {
        continue;
      }
      
      // Detect based on pause duration
      if (gap >= this.config.pauseThresholds.paragraph) {
        boundaries.set(i, { punctuation: '.', type: 'paragraph' });
      } else if (gap >= this.config.pauseThresholds.period) {
        boundaries.set(i, { punctuation: '.', type: 'sentence' });
      } else if (gap >= this.config.pauseThresholds.comma) {
        // Only add comma if not at question words
        const nextWord = words[i + 1]?.text.toLowerCase();
        if (!['what', 'why', 'how', 'when', 'where', 'who'].includes(nextWord)) {
          boundaries.set(i, { punctuation: ',', type: 'clause' });
        }
      }
    }
    
    return boundaries;
  }
}

interface WordWithTiming {
  text: string;
  startTime: number;
  endTime: number;
}

interface SentenceBoundary {
  punctuation: string;
  type: 'sentence' | 'paragraph' | 'clause';
}
```

**Acceptance Criteria:**
- [ ] Capitalizes sentence starts correctly
- [ ] Inserts periods based on pause duration
- [ ] Handles abbreviations (Mr., Dr., etc.)
- [ ] Formats pending text without final formatting decisions

---

### Task 3: Integration with Audio Capture

**File:** `src/lib/audio/StreamingAudioProcessor.ts`

**Purpose:** Connects AudioWorklet output to TokenStreamTranscriber.

```typescript
import { TokenStreamTranscriber, TranscriptionUpdate } from '../transcription/TokenStreamTranscriber';

export class StreamingAudioProcessor {
  private transcriber: TokenStreamTranscriber;
  private audioBuffer: Float32Array[] = [];
  private bufferDuration: number = 0;
  private currentTimestamp: number = 0;
  
  private readonly SAMPLE_RATE = 16000;
  private readonly CHUNK_DURATION: number;  // seconds
  private readonly OVERLAP_DURATION: number; // seconds
  
  constructor(transcriber: TokenStreamTranscriber, config: { chunkDuration?: number; overlapDuration?: number } = {}) {
    this.transcriber = transcriber;
    this.CHUNK_DURATION = config.chunkDuration ?? 5.0;
    this.OVERLAP_DURATION = config.overlapDuration ?? 2.0;
  }
  
  /**
   * Called by AudioWorklet with new audio samples.
   */
  async onAudioData(samples: Float32Array): Promise<TranscriptionUpdate | null> {
    // Add to buffer
    this.audioBuffer.push(samples);
    this.bufferDuration += samples.length / this.SAMPLE_RATE;
    
    // Check if we have enough for a chunk
    if (this.bufferDuration >= this.CHUNK_DURATION) {
      const audio = this.extractChunk();
      const result = await this.transcriber.processChunk(audio, this.currentTimestamp);
      
      // Advance timestamp (minus overlap for next chunk)
      this.currentTimestamp += this.CHUNK_DURATION - this.OVERLAP_DURATION;
      
      return result;
    }
    
    return null;
  }
  
  private extractChunk(): Float32Array {
    // Concatenate buffer into single array
    const totalSamples = this.audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
    const chunkSamples = Math.floor(this.CHUNK_DURATION * this.SAMPLE_RATE);
    
    const result = new Float32Array(Math.min(totalSamples, chunkSamples));
    let offset = 0;
    
    for (const arr of this.audioBuffer) {
      const toCopy = Math.min(arr.length, result.length - offset);
      result.set(arr.subarray(0, toCopy), offset);
      offset += toCopy;
      if (offset >= result.length) break;
    }
    
    // Keep overlap in buffer
    const overlapSamples = Math.floor(this.OVERLAP_DURATION * this.SAMPLE_RATE);
    const newBuffer: Float32Array[] = [];
    let remainingSamples = overlapSamples;
    
    // Keep last N samples for overlap
    for (let i = this.audioBuffer.length - 1; i >= 0 && remainingSamples > 0; i--) {
      const arr = this.audioBuffer[i];
      if (arr.length <= remainingSamples) {
        newBuffer.unshift(arr);
        remainingSamples -= arr.length;
      } else {
        newBuffer.unshift(arr.subarray(arr.length - remainingSamples));
        remainingSamples = 0;
      }
    }
    
    this.audioBuffer = newBuffer;
    this.bufferDuration = this.OVERLAP_DURATION;
    
    return result;
  }
  
  reset(): void {
    this.audioBuffer = [];
    this.bufferDuration = 0;
    this.currentTimestamp = 0;
    this.transcriber.reset();
  }
}
```

**Acceptance Criteria:**
- [ ] Buffers audio samples until chunk size reached
- [ ] Maintains overlap for next chunk
- [ ] Correctly tracks absolute timestamps
- [ ] Integrates with AudioWorklet output

---

### Task 4: UI Components for Confirmed/Pending Text

**File:** `src/components/TranscriptDisplay.tsx`

**Purpose:** Display transcription with visual distinction between confirmed and pending text.

```tsx
import { Component, createSignal, createEffect } from 'solid-js';
import { TranscriptionUpdate } from '../lib/transcription/TokenStreamTranscriber';

interface TranscriptDisplayProps {
  update: TranscriptionUpdate | null;
  showStats?: boolean;
}

export const TranscriptDisplay: Component<TranscriptDisplayProps> = (props) => {
  return (
    <div class="transcript-container p-4 bg-white rounded-lg shadow">
      {/* Main transcript */}
      <div class="transcript-text text-lg leading-relaxed">
        {/* Confirmed text - solid black */}
        <span class="confirmed-text text-gray-900">
          {props.update?.confirmed ?? ''}
        </span>
        
        {/* Pending text - gray italic */}
        {props.update?.pending && (
          <span class="pending-text text-gray-400 italic ml-1">
            {props.update.pending}
          </span>
        )}
        
        {/* Cursor */}
        <span class="cursor inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-0.5" />
      </div>
      
      {/* Stats (optional) */}
      {props.showStats && props.update?.stats && (
        <div class="stats text-xs text-gray-500 mt-2 border-t pt-2">
          <span>Confirmed: {props.update.stats.confirmedCount}</span>
          <span class="mx-2">|</span>
          <span>Pending: {props.update.stats.pendingCount}</span>
          <span class="mx-2">|</span>
          <span>Anchors: {props.update.stats.anchorsFound}</span>
          <span class="mx-2">|</span>
          <span>Time: {props.update.stats.processingTimeMs.toFixed(0)}ms</span>
        </div>
      )}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Confirmed text displayed in solid black
- [ ] Pending text displayed in gray italic
- [ ] Blinking cursor at end
- [ ] Optional stats display

---

## Implementation Order

1. **Task 2: DelayedTextFormatter** - Independent, no dependencies
2. **Task 1: TokenStreamTranscriber** - Depends on DelayedTextFormatter
3. **Task 3: StreamingAudioProcessor** - Depends on TokenStreamTranscriber
4. **Task 4: UI Components** - Can be done in parallel

---

## Testing Strategy

### Unit Tests

```typescript
// TokenStreamTranscriber.test.ts
describe('TokenStreamTranscriber', () => {
  it('should merge overlapping chunks correctly', async () => {
    // Setup mock model
    // Process two overlapping chunks
    // Verify tokens are merged without duplicates
  });
  
  it('should track confirmed vs pending tokens', async () => {
    // Process multiple chunks
    // Verify stability threshold works
  });
});

// DelayedTextFormatter.test.ts
describe('DelayedTextFormatter', () => {
  it('should capitalize sentence starts', () => {
    const tokens = [{ text: 'hello', absTime: 0 }, { text: 'world', absTime: 0.5 }];
    expect(formatter.format(tokens)).toBe('Hello world');
  });
  
  it('should insert period after long pause', () => {
    const tokens = [
      { text: 'hello', absTime: 0, endTime: 0.3 },
      { text: 'world', absTime: 1.2 }  // 0.9s gap
    ];
    expect(formatter.format(tokens)).toContain('.');
  });
});
```

### Integration Tests

```typescript
// Full pipeline test with real audio
describe('Streaming Pipeline', () => {
  it('should transcribe continuous speech', async () => {
    const audioFile = await loadTestAudio('test-speech.wav');
    const chunks = splitIntoChunks(audioFile, 5000, 2000); // 5s chunks, 2s overlap
    
    let fullText = '';
    for (const chunk of chunks) {
      const result = await processor.onAudioData(chunk);
      if (result) fullText = result.full;
    }
    
    expect(fullText).toContain('expected phrase');
  });
});
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Latency | < 500ms | Time from audio to UI update |
| Accuracy | > 95% WER | Compared to offline transcription |
| Merge Success | > 90% | Chunks merged without loss/duplication |
| Memory | < 100MB | Total JS heap usage |

---

## Next Steps

1. Start with Task 2 (DelayedTextFormatter) - smallest, independent
2. Implement Task 1 (TokenStreamTranscriber) 
3. Wire up Task 3 (StreamingAudioProcessor) with existing Audio Capture
4. Build Task 4 (UI) and test end-to-end
5. Tune parameters (stability threshold, pause thresholds)
