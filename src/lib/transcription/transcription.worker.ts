/**
 * BoncukJS v3.0 - Transcription Web Worker
 * 
 * Runs heavy AI inference and text merging in a background thread
 * to prevent UI stuttering on the main thread.
 */

import { ParakeetModel, getParakeetModel } from 'parakeet.js';
import { TranscriptionService } from './TranscriptionService';
import { TokenStreamTranscriber } from './TokenStreamTranscriber';
import { ModelManager } from './ModelManager';

let modelManager: ModelManager | null = null;
let transcriptionService: TranscriptionService | null = null;
let tokenStreamTranscriber: TokenStreamTranscriber | null = null;

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
                } else if (transcriptionService) {
                    const finalResult = transcriptionService.finalize();
                    postMessage({ type: 'FINALIZE_DONE', payload: finalResult, id });
                }
                break;

            default:
                console.warn('[TranscriptionWorker] Unknown message type:', type);
        }
    } catch (err: any) {
        console.error('[TranscriptionWorker] Error:', err);
        postMessage({ type: 'ERROR', payload: err.message, id });
    }
};
