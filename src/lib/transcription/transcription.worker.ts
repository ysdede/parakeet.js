/**
 * BoncukJS v4.0 - Transcription Web Worker
 * 
 * Runs heavy AI inference and text merging in a background thread
 * to prevent UI stuttering on the main thread.
 *
 * Supports both:
 * - v3 token-stream mode (LCSPTFAMerger, fixed-window)
 * - v4 utterance mode (UtteranceBasedMerger, cursor-based windowing)
 */

import { ParakeetModel, getParakeetModel } from 'parakeet.js';
import { TranscriptionService } from './TranscriptionService';
import { TokenStreamTranscriber } from './TokenStreamTranscriber';
import { ModelManager } from './ModelManager';
import { UtteranceBasedMerger } from './UtteranceBasedMerger';
import type { ASRResult, MergerResult } from './UtteranceBasedMerger';

let modelManager: ModelManager | null = null;
let transcriptionService: TranscriptionService | null = null;
let tokenStreamTranscriber: TokenStreamTranscriber | null = null;
let utteranceMerger: UtteranceBasedMerger | null = null;

// Mock callbacks for ModelManager
const modelCallbacks = {
    onProgress: (p: any) => {
        postMessage({ type: 'MODEL_PROGRESS', payload: p });
    },
    onStateChange: (s: any) => {
        postMessage({ type: 'MODEL_STATE', payload: s });
    },
    onError: (e: Error) => {
        postMessage({ type: 'ERROR', payload: e.message });
    }
};

// Mock callbacks for TranscriptionService
const transcriptionCallbacks = {
    onResult: (result: any) => {
        postMessage({ type: 'TRANSCRIPTION_RESULT', payload: result });
    },
    onError: (e: Error) => {
        postMessage({ type: 'ERROR', payload: e.message });
    }
};

self.onmessage = async (e: MessageEvent) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case 'INIT_MODEL':
                if (!modelManager) {
                    modelManager = new ModelManager(modelCallbacks);
                }
                await modelManager.loadModel(payload);
                postMessage({ type: 'INIT_MODEL_DONE', id });
                break;

            case 'LOAD_LOCAL_MODEL':
                if (!modelManager) {
                    modelManager = new ModelManager(modelCallbacks);
                }
                // FileList can't be easily sent, but File can be part of Transferable or just sent as is
                await modelManager.loadLocalModel(payload);
                postMessage({ type: 'INIT_MODEL_DONE', id });
                break;

            case 'INIT_SERVICE':
                if (!modelManager) {
                    throw new Error('ModelManager not initialized');
                }
                transcriptionService = new TranscriptionService(
                    modelManager,
                    payload.config,
                    transcriptionCallbacks
                );
                transcriptionService.initialize();
                postMessage({ type: 'INIT_SERVICE_DONE', id });
                break;

            case 'INIT_V3_SERVICE':
                if (!modelManager) {
                    throw new Error('ModelManager not initialized');
                }
                tokenStreamTranscriber = new TokenStreamTranscriber(
                    modelManager,
                    payload.config,
                    {
                        onConfirmedUpdate: (text: string, words: any[]) => postMessage({ type: 'V3_CONFIRMED', payload: { text, words } }),
                        onPendingUpdate: (text: string, words: any[]) => postMessage({ type: 'V3_PENDING', payload: { text, words } }),
                        onError: (e: Error) => postMessage({ type: 'ERROR', payload: e.message })
                    }
                );
                await tokenStreamTranscriber.initialize();
                postMessage({ type: 'INIT_V3_SERVICE_DONE', id });
                break;

            case 'PROCESS_CHUNK':
                if (!transcriptionService) {
                    throw new Error('TranscriptionService not initialized');
                }
                const result = await transcriptionService.processChunk(payload);
                postMessage({ type: 'PROCESS_CHUNK_DONE', payload: result, id });
                break;

            case 'PROCESS_V3_CHUNK':
                if (!tokenStreamTranscriber) {
                    throw new Error('TokenStreamTranscriber not initialized');
                }
                const v3Result = await tokenStreamTranscriber.processChunk(payload.audio, payload.startTime);
                // Return result AND current state for UI
                const state = tokenStreamTranscriber.getState();
                postMessage({
                    type: 'PROCESS_V3_CHUNK_DONE',
                    payload: {
                        ...v3Result,
                        lcsLength: v3Result.lcsLength,
                        anchorValid: v3Result.anchorValid,
                        anchorTokens: v3Result.anchorTokens,
                        chunkCount: state.chunkCount
                    },
                    id
                });
                break;

            case 'PROCESS_V3_CHUNK_WITH_FEATURES':
                if (!tokenStreamTranscriber) {
                    throw new Error('TokenStreamTranscriber not initialized');
                }
                const v3FeatResult = await tokenStreamTranscriber.processChunkWithFeatures(
                    payload.features,
                    payload.T,
                    payload.melBins,
                    payload.startTime,
                    payload.overlapSeconds,
                );
                // Return result AND current state for UI
                const featState = tokenStreamTranscriber.getState();
                postMessage({
                    type: 'PROCESS_V3_CHUNK_WITH_FEATURES_DONE',
                    payload: {
                        ...v3FeatResult,
                        lcsLength: v3FeatResult.lcsLength,
                        anchorValid: v3FeatResult.anchorValid,
                        anchorTokens: v3FeatResult.anchorTokens,
                        chunkCount: featState.chunkCount
                    },
                    id
                });
                break;

            case 'TRANSCRIBE_SEGMENT':
                if (!transcriptionService) {
                    throw new Error('TranscriptionService not initialized');
                }
                const segResult = await transcriptionService.transcribeSegment(payload);
                postMessage({ type: 'TRANSCRIBE_SEGMENT_DONE', payload: segResult, id });
                break;

            case 'RESET':
                if (transcriptionService) {
                    transcriptionService.reset();
                }
                postMessage({ type: 'RESET_DONE', id });
                break;

            case 'FINALIZE':
                if (tokenStreamTranscriber) {
                    const final = tokenStreamTranscriber.finalize();
                    postMessage({ type: 'FINALIZE_DONE', payload: { text: final.fullText }, id });
                } else if (utteranceMerger) {
                    // For v4 utterance mode, finalize pending sentence
                    const flushResult = utteranceMerger.finalizePendingSentenceByTimeout();
                    const mergerResult = flushResult || {
                        matureText: utteranceMerger.getMatureText(),
                        immatureText: utteranceMerger.getImmatureText(),
                        matureCursorTime: utteranceMerger.getMatureCursorTime(),
                    };
                    postMessage({ type: 'FINALIZE_DONE', payload: mergerResult, id });
                } else if (transcriptionService) {
                    const finalResult = transcriptionService.finalize();
                    postMessage({ type: 'FINALIZE_DONE', payload: finalResult, id });
                }
                break;

            // ---- v4 Utterance-based pipeline ----

            case 'INIT_V4_SERVICE': {
                if (!modelManager) {
                    throw new Error('ModelManager not initialized');
                }
                utteranceMerger = new UtteranceBasedMerger(payload.config || {});
                postMessage({ type: 'INIT_V4_SERVICE_DONE', id });
                break;
            }

            case 'PROCESS_V4_CHUNK_WITH_FEATURES': {
                if (!modelManager) {
                    throw new Error('ModelManager not initialized');
                }
                if (!utteranceMerger) {
                    throw new Error('UtteranceBasedMerger not initialized');
                }

                const model = modelManager.getModel();
                if (!model) {
                    throw new Error('Model not loaded');
                }

                // Transcribe using pre-computed mel features
                const v4TranscribeResult = await model.transcribe(null, 16000, {
                    precomputedFeatures: {
                        features: payload.features,
                        T: payload.T,
                        melBins: payload.melBins,
                    },
                    returnTimestamps: true,
                    returnTokenIds: true,
                    returnFrameIndices: true,
                    timeOffset: payload.timeOffset || 0,
                    // Incremental decoder cache for the overlap prefix
                    ...(payload.incrementalCache ? {
                        incremental: {
                            cacheKey: payload.incrementalCache.cacheKey,
                            prefixSeconds: payload.incrementalCache.prefixSeconds,
                        },
                    } : {}),
                });

                // Feed ASR result into the utterance merger
                const asrResult: ASRResult = {
                    utterance_text: v4TranscribeResult.utterance_text,
                    words: v4TranscribeResult.words?.map((w: any) => ({
                        text: w.text,
                        start_time: w.start_time,
                        end_time: w.end_time,
                        confidence: w.confidence,
                    })),
                    end_time: payload.endTime || 0,
                    segment_id: payload.segmentId,
                };

                const v4MergerResult = utteranceMerger.processASRResult(asrResult);

                postMessage({
                    type: 'PROCESS_V4_CHUNK_WITH_FEATURES_DONE',
                    payload: {
                        // Merger state
                        matureText: v4MergerResult.matureText,
                        immatureText: v4MergerResult.immatureText,
                        matureCursorTime: v4MergerResult.matureCursorTime,
                        fullText: v4MergerResult.fullText,
                        // Raw ASR metrics
                        metrics: v4TranscribeResult.metrics,
                        // Sentence info
                        totalSentences: v4MergerResult.totalSentences,
                        matureSentenceCount: v4MergerResult.allMatureSentences.length,
                        pendingSentence: v4MergerResult.pendingSentence?.text || null,
                        stats: v4MergerResult.stats,
                    },
                    id,
                });
                break;
            }

            case 'V4_FINALIZE_TIMEOUT': {
                if (!utteranceMerger) {
                    throw new Error('UtteranceBasedMerger not initialized');
                }
                const timeoutResult = utteranceMerger.finalizePendingSentenceByTimeout();
                postMessage({
                    type: 'V4_FINALIZE_TIMEOUT_DONE',
                    payload: timeoutResult ? {
                        matureText: timeoutResult.matureText,
                        immatureText: timeoutResult.immatureText,
                        matureCursorTime: timeoutResult.matureCursorTime,
                        fullText: timeoutResult.fullText,
                    } : null,
                    id,
                });
                break;
            }

            case 'V4_RESET': {
                if (utteranceMerger) {
                    utteranceMerger.reset();
                }
                postMessage({ type: 'V4_RESET_DONE', id });
                break;
            }

            default:
                console.warn('[TranscriptionWorker] Unknown message type:', type);
        }
    } catch (err: any) {
        console.error('[TranscriptionWorker] Error:', err);
        postMessage({ type: 'ERROR', payload: err.message, id });
    }
};
