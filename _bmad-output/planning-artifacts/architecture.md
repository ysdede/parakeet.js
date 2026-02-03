---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
lastStep: 9
status: 'complete'
completedAt: '2026-02-01'
inputDocuments:
  - boncukjs/_bmad-output/planning-artifacts/streaming-architecture-v3.md
  - boncukjs/_bmad-output/planning-artifacts/implementation-plan-v3.md
solidjsReference: 'N:\github\ysdede\solidjs-context\solidjs-context-pipeline\solidjs_context'
workflowType: 'architecture'
project_name: 'BoncukJS v2.0'
user_name: 'yunus'
date: '2026-02-01'
keyDecisions:
  - 'REVERTED: State-Preserving Streaming (incompatible with ONNX)'
  - 'ADOPTED: Token-Level Local Agreement with Frame-Aligned Merging'
  - 'Dual-stage VAD pipeline (Pre + Post)'
  - 'SolidJS frontend with TypeScript'
  - 'Sentence-Context Windows: Retranscribe last 2-3 sentences for model context (NO post-processing for caps/punct)'
---

# BoncukJS v2.0 Architecture Decision Document

_Real-time Speech Transcription Web Application_

**Status:** REVISED (Feb 2026) - v3 Architecture

---

## 0. Core Architecture Decision

## ⚠️ REVISED: Token-Level Local Agreement (v3.0)

**Decision:** Use **Token-Level Local Agreement** with **Frame-Aligned Merging**.

> **Course Correction (Feb 2026):** The previously chosen "State-Preserving Streaming" approach (NVIDIA NeMo) was found to be incompatible with ONNX Runtime Web because the ONNX export does not support incremental encoding (no KV-cache). Adding new audio frames changes ALL encoder outputs, invalidating the decoder state.

**New Strategy:** A hybrid approach combining:
1.  **Token-Level Merging:** Compare tokens by `(id, frameIndex, timestamp)` instead of text.
2.  **Frame-Aligned Streaming:** Leverage new `parakeet.js` features (`returnFrameIndices`, `returnLogProbs`) for precise alignment.
3.  **Mel Feature Caching:** Cache mel spectrograms for 10-15% compute savings on overlapping regions.
4.  **Sentence-Context Windows:** Retranscribe last 2-3 sentences + new audio so model has context to produce correct caps/punct (NO post-processing).

| Approach | Logic | Status |
|----------|-------|--------|
| ~~State-Preserving~~ | Decoder state continuation | ❌ FAILED (ONNX limitation) |
| ~~Text Merging~~ | Fuzzy string matching | ❌ DEPRECATED (Too complex) |
| **Token-Level Agreement** | Exact ID + Frame matching | ✅ **CHOSEN (v3)** |

---

## 0.1 🚀 The v3 Streaming Architecture

**Reference:** `streaming-architecture-v3.md`

```
┌─────────────────────────────────────────────────────────────────────────┐
│              OPTIMIZED STREAMING PIPELINE (v3.0)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LAYER 1: MEL CACHE (10-15% savings)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Audio [0-14s] = Audio [0-12s] (cached) + Audio [12-14s] (new)  │   │
│  │                                                                 │   │
│  │ Cached mel [0-12s] ────┐                                       │   │
│  │                        ├───► Combined mel [0-14s]              │   │
│  │ Compute mel [12-14s] ──┘                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LAYER 2: ENCODER (No caching - required)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Combined mel → Encoder → enc_features [T_enc, 640]             │   │
│  │ (Self-attention means all frames must be encoded together)     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LAYER 3: TOKEN-FRAME ALIGNED DECODE                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ For each encoder frame t:                                      │   │
│  │   token = decode(enc[t], prev_token, lstm_state)               │   │
│  │   if token != blank:                                           │   │
│  │     emit(token, frameIndex=t, logProb, timestamp)              │   │
│  │                                                                 │   │
│  │ Output: {                                                      │   │
│  │   tokenIds:     [423, 891, 102, ...]                          │   │
│  │   frameIndices: [13,  21,  28,  ...]  ← NEW                   │   │
│  │   logProbs:     [-0.05, -0.02, ...]   ← NEW                   │   │
│  │ }                                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LAYER 4: FRAME-ALIGNED MERGE                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Compare tokens by (tokenId, frameIndex) not by text!           │   │
│  │                                                                 │   │
│  │ Prev: [(id:40, f:50), (id:50, f:55), (id:60, f:62)]           │   │
│  │ Curr: [(id:40, f:5),  (id:50, f:10), (id:60, f:17), (id:70,...│   │
│  │                                                                 │   │
│  │ Overlap: frames 0-15 in curr = frames 45-60 in prev           │   │
│  │ Match: id:50 appears in both at aligned position → anchor!     │   │
│  │                                                                 │   │
│  │ Result: Keep prev tokens up to anchor, append curr after       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LAYER 5: MODEL OUTPUT (No Post-Processing)                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ The Parakeet model ALREADY outputs proper caps & punctuation!  │   │
│  │                                                                 │   │
│  │ We achieve correct formatting by:                              │   │
│  │   • Retranscribing last 2-3 sentences + new audio              │   │
│  │   • Model sees complete sentences → produces correct format    │   │
│  │   • NO post-processing needed                                  │   │
│  │                                                                 │   │
│  │ Model output: "How are you today? I am fine."  (display as-is)│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Executive Summary

BoncukJS v2.0 is a complete re-architecture of the existing boncukjs application, focused on creating a **lightweight, high-performance real-time transcription** web app using:

- **SolidJS** for reactive UI
- **parakeet.js** for WebGPU/WASM inference (NVIDIA Parakeet TDT models)
- **Dual-Stage VAD** (Energy + ML) for efficient audio processing
- **Frame-Aligned Merging** for robust streaming transcription

### 1.1 Project Scope & Component Ownership

This architecture covers the **BoncukJS ecosystem**:

| Repository | Role | Owner |
|------------|------|-------|
| **boncukjs** | Frontend application (SolidJS) | @ysdede |
| **parakeet.js** | ASR inference library (WebGPU/WASM) | @ysdede |
| **parakeet-ui** | Legacy frontend (Svelte) - reference | @yd-zd |
| **zdasr-main** | Python backend - reference | @yd-zd |

---

## 2. Architecture Diagram

### 2.1 High-Level Data Flow (v3)

```mermaid
flowchart TB
    subgraph Input["🎤 Audio Input"]
        MIC[Microphone]
        WAA[Web Audio API]
        AWP[AudioWorkletProcessor]
    end

    subgraph Pipeline["⚡ Audio Pipeline"]
        RB[RingBuffer<br/>120s circular buffer]
        SEG[Segmenter<br/>Frame-aligned chunks]
        
        subgraph DualVAD["🔊 Dual-Stage VAD"]
            EG[EnergyGate<br/>Pre-VAD]
            ML[ML VAD<br/>Post-VAD (Silero/Ten)]
        end
        
        WS[WindowSelector]
    end

    subgraph Inference["🧠 Inference Engine"]
        MC[MelFeatureCache<br/>Reuse mel specs]
        PKT[parakeet.js<br/>WebGPU/WASM]
        
        subgraph Model["Parakeet TDT"]
            ENC[Encoder<br/>Non-incremental]
            DEC[Decoder<br/>Stateful]
        end
    end

    subgraph Streaming["📝 Streaming Orchestrator"]
        FAM[FrameAlignedMerger<br/>Token-level merge]
        DTF[DelayedTextFormatter<br/>Caps & Punct]
        TST[TokenStreamTranscriber]
    end

    subgraph Output["📺 UI Output"]
        TR[Transcript Display<br/>Confirmed vs Pending]
        WF[Waveform + VAD Viz]
        ST[Status/Stats]
    end

    MIC --> WAA --> AWP --> RB
    RB --> SEG --> EG --> ML --> WS
    WS -->|Audio Chunk| TST
    TST -->|Get Features| MC
    MC -->|Mel Specs| PKT
    PKT -->|Frame-Aligned Tokens| FAM
    FAM -->|Confirmed Tokens| DTF
    DTF -->|Final Text| TR
    FAM -.->|Pending Tokens| TR
    RB -.-> WF
```

---

## 3. Core Class Design

### 3.1 Audio Engine & VAD (See previous documentation)
(RingBuffer, AudioEngine, DualVADPipeline interfaces remain valid)

### 3.2 TokenStreamTranscriber (New)

```typescript
export class TokenStreamTranscriber {
  constructor(model: ParakeetModel, config: StreamingConfig);
  
  async processChunk(audio: Float32Array, timestamp: number): Promise<TranscriptionUpdate>;
  
  reset(): void;
}

export interface TranscriptionUpdate {
  confirmed: string;          // Stable text
  pending: string;            // Unstable text
  full: string;               // Combined
  stats: TranscriptionStats;
}
```

### 3.3 FrameAlignedMerger (New - in parakeet.js)

```typescript
export class FrameAlignedMerger {
  constructor(opts: MergerOptions);
  
  processChunk(result: ParakeetResult, chunkStartTime: number, overlapDuration: number): MergeResult;
  
  getState(): MergerState;
}
```

### 3.4 DelayedTextFormatter (New)

```typescript
export class DelayedTextFormatter {
  format(tokens: ConfirmedToken[]): string;
  formatPending(tokens: TokenData[]): string;
}
```

---

## 4. Refactor Plan (Updated)

### Phase 0: parakeet.js Enhancement
- ✅ **0.1** Add `returnFrameIndices`, `returnLogProbs` to `transcribe()`
- ✅ **0.2** Implement `MelFeatureCache`
- ✅ **0.3** Implement `FrameAlignedMerger`
- ✅ **0.4** Export new APIs

### Phase 1: Foundation (Audio Pipeline + Dual-Stage VAD)
- **1.1** Project setup (SolidJS + Vite)
- **1.2** RingBuffer implementation
- **1.3** Pre-VAD (Energy) implementation
- **1.4** Post-VAD (ML) implementation
- **1.7** DualVADPipeline integration

### Phase 2: Inference Integration
- **2.1** Integrate `parakeet.js`
- **2.2** Implement `WindowSelector`

### Phase 3: Streaming Implementation (v3)
- **3.1** Implement `TokenStreamTranscriber` (BoncukJS)
- **3.2** Implement `DelayedTextFormatter` (BoncukJS)
- **3.3** Implement `StreamingAudioProcessor` (BoncukJS)
- **3.4** Integrate with Audio Engine

### Phase 4: UI Implementation
- **4.1** UI Components (Header, TranscriptPanel, etc.)
- **4.2** Confirmed vs Pending text display
- **4.3** Waveform visualization

---

## 5. Technical Decisions

### 5.1 Why Token-Level Merging?
Traditional text merging is fragile because "Hello" and "hello" look different. Token-level merging compares unique IDs (`423` vs `423`), which is robust. Adding frame indices (`frame: 12`) ensures we only merge tokens that occur at the *same time* in the audio.

### 5.2 Two-Stage Pipeline
Splitting acoustic recognition (Stage 1) from text formatting (Stage 2) allows us to have:
- **Low Latency:** User sees words immediately.
- **High Quality:** Punctuation and capitalization are applied correctly once context is established.

---

## 6. Documentation Map

| Document | Purpose | Status |
|----------|---------|--------|
| `streaming-architecture-v3.md` | Detailed streaming architecture | ✅ Current |
| `implementation-plan-v3.md` | Step-by-step implementation tasks | ✅ Current |
| `architecture.md` | High-level system overview | ✅ Updated |
