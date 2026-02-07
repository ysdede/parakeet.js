/**
 * UtteranceBasedMerger.ts
 *
 * A sentence-based transcription merging approach that processes progressive
 * utterance texts. Sentences are detected via winkNLP and finalized once a
 * following sentence appears (proving the previous one is stable).
 *
 * Ported from parakeet-ui/src/UtteranceBasedMerger.js to TypeScript,
 * with additions for VAD-informed timeout finalization and parakeet.js
 * word timestamp format integration.
 *
 * State model: [mature (finalized) sentences] + [active immature sentence]
 */

import {
    SentenceBoundaryDetector,
    type DetectorWord,
    type SentenceEndingWord,
} from './SentenceBoundaryDetector';

// ---- Public types ----

/** A word from the ASR result (parakeet.js format) */
export interface ASRWord {
    text: string;
    start_time: number;
    end_time: number;
    confidence?: number;
}

/** An ASR result to feed into the merger */
export interface ASRResult {
    utterance_text: string;
    words?: ASRWord[];
    timestamp?: number;
    segment_id?: string;
    end_time?: number;
}

/** A finalized or pending sentence */
export interface MergerSentence {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    startWordIndex: number;
    endWordIndex: number;
    wordCount: number;
    words: DetectorWord[];
    detectionMethod: string;
    isMature: boolean;
    utteranceId?: string;
    timestamp?: number;
    wordEndTime?: number;
    sentenceEndingWord?: SentenceEndingWord;
}

/** The result returned from processASRResult */
export interface MergerResult {
    matureText: string;
    currentText: string;
    fullText: string;
    immatureText: string;
    matureCursorTime: number;
    totalSentences: number;
    matureSentences: MergerSentence[];
    allMatureSentences: MergerSentence[];
    pendingSentence: MergerSentence | null;
    usedPreciseTimestamps: boolean;
    stats: MergerStats;
    utteranceCount: number;
    lastUtteranceText: string;
}

/** Statistics for the merger */
export interface MergerStats {
    utterancesProcessed: number;
    sentencesDetected: number;
    matureSentencesCreated: number;
    matureCursorUpdates: number;
}

/** Configuration for UtteranceBasedMerger */
export interface UtteranceBasedMergerConfig {
    debug: boolean;
    useNLP: boolean;
    minSentenceLength: number;
    requireFollowingSentence: boolean;
    matureSentenceOffset: number;
    skipEmptyUtterances: boolean;
    skipSingleSentences: boolean;
    enableTimeoutFinalization: boolean;
    finalizeTimeoutMs: number;
}

// ---- Internal types ----

interface Utterance {
    id: string;
    text: string;
    words: DetectorWord[];
    timestamp: number;
    endTime: number;
    processed: boolean;
}

interface SentenceDetectionResult {
    sentences: MergerSentence[];
    matureSentences: MergerSentence[];
    totalSentences: number;
    sentenceEndings: SentenceEndingWord[];
    usedPreciseTimestamps: boolean;
}

// ---- Implementation ----

export class UtteranceBasedMerger {
    private config: UtteranceBasedMergerConfig;
    private sentenceDetector: SentenceBoundaryDetector;

    // Core state
    private utterances: Utterance[] = [];
    private matureSentences: MergerSentence[] = [];
    private currentUtteranceText: string = '';
    private matureCursorTime: number = 0;
    private pendingSentence: MergerSentence | null = null;

    // Statistics
    private stats: MergerStats = {
        utterancesProcessed: 0,
        sentencesDetected: 0,
        matureSentencesCreated: 0,
        matureCursorUpdates: 0,
    };

    constructor(config: Partial<UtteranceBasedMergerConfig> = {}) {
        this.config = {
            debug: false,
            useNLP: true,
            minSentenceLength: 10,
            requireFollowingSentence: true,
            matureSentenceOffset: -2,
            skipEmptyUtterances: true,
            skipSingleSentences: true,
            enableTimeoutFinalization: true,
            finalizeTimeoutMs: 2000,
            ...config,
        };

        this.sentenceDetector = new SentenceBoundaryDetector({
            useNLP: this.config.useNLP,
            debug: this.config.debug,
            minSentenceLength: this.config.minSentenceLength,
        });

        if (this.config.debug) {
            console.log('[UtteranceMerger] Initialized with config:', this.config);
        }
    }

    /**
     * Process a new ASR result with utterance text and precise word timestamps.
     * This is the main entry point for parakeet.js integration.
     */
    processASRResult(asrResult: ASRResult): MergerResult {
        const {
            utterance_text,
            words = [],
            timestamp = Date.now(),
            segment_id,
            end_time = 0,
        } = asrResult;

        if (this.config.debug) {
            console.log(
                `[UtteranceMerger] Processing ASR result: "${utterance_text}" with ${words.length} words`
            );
        }

        // Skip empty or very short utterances
        if (
            this.config.skipEmptyUtterances &&
            (!utterance_text || utterance_text.trim().length < this.config.minSentenceLength)
        ) {
            if (this.config.debug) {
                console.log('[UtteranceMerger] Skipping empty/short utterance');
            }
            return this.createResult();
        }

        // Convert parakeet.js words to detector format
        const detectorWords: DetectorWord[] = words.map((w, index) => ({
            text: (w.text || '').toString().trim(),
            start: Math.max(0, w.start_time),
            end: Math.max(w.start_time, w.end_time),
            wordIndex: index,
            confidence: typeof w.confidence === 'number' ? Math.max(0, Math.min(1, w.confidence)) : 1.0,
        })).filter(w => w.text.length > 0);

        // Store utterance
        const utterance: Utterance = {
            id: segment_id || `utterance_${timestamp}`,
            text: utterance_text.trim(),
            words: detectorWords,
            timestamp,
            endTime: end_time,
            processed: false,
        };

        this.utterances.push(utterance);
        this.currentUtteranceText = utterance_text.trim();
        this.stats.utterancesProcessed++;

        // Detect sentences
        const sentenceResult = this.detectSentencesInUtterance(utterance);

        // Track the most recent ended sentence as a pending candidate
        if (sentenceResult && sentenceResult.sentences && sentenceResult.sentences.length > 0) {
            const lastEndedSentence = sentenceResult.sentences[sentenceResult.sentences.length - 1];
            if (lastEndedSentence) {
                this.pendingSentence = {
                    ...lastEndedSentence,
                    utteranceId: utterance.id,
                    timestamp: utterance.timestamp,
                    wordEndTime: lastEndedSentence.endTime,
                    isMature: false,
                };
            }
        } else {
            this.pendingSentence = null;
        }

        // Update mature cursor
        if (sentenceResult.matureSentences.length > 0) {
            this.updateMatureCursor(sentenceResult.matureSentences, end_time);
        }

        utterance.processed = true;

        return this.createResult(sentenceResult);
    }

    /**
     * Detect sentences in an utterance using winkNLP with precise word timestamps.
     */
    private detectSentencesInUtterance(utterance: Utterance): SentenceDetectionResult {
        const { text, words, endTime, timestamp } = utterance;

        let wordsForDetection: DetectorWord[];

        if (words.length > 0) {
            wordsForDetection = words;
            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Using ${wordsForDetection.length} precise word timestamps from ASR`
                );
            }
        } else {
            // Fallback to estimation
            const estimatedStartTime = Math.max(0, endTime - text.length * 0.05);
            wordsForDetection = this.textToWords(text, estimatedStartTime, endTime);
            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Using ${wordsForDetection.length} estimated word timestamps`
                );
            }
        }

        if (wordsForDetection.length === 0) {
            return {
                sentences: [],
                matureSentences: [],
                totalSentences: 0,
                sentenceEndings: [],
                usedPreciseTimestamps: false,
            };
        }

        // Detect sentence boundaries
        const sentenceEndings = this.sentenceDetector.detectSentenceEndings(wordsForDetection);
        this.stats.sentencesDetected += sentenceEndings.length;

        if (this.config.debug) {
            console.log(
                `[UtteranceMerger] Detected ${sentenceEndings.length} sentences in utterance`
            );
        }

        // Extract sentences with precise timestamps
        const sentences = this.extractSentencesFromEndings(text, sentenceEndings, wordsForDetection);

        // Determine which sentences are mature
        const matureSentences = this.determineMatureSentences(sentences, utterance, sentenceEndings);

        return {
            sentences,
            matureSentences,
            totalSentences: sentences.length,
            sentenceEndings,
            usedPreciseTimestamps: words.length > 0,
        };
    }

    /**
     * Convert text to word objects with estimated timestamps (fallback).
     */
    private textToWords(
        text: string,
        utteranceStartTime: number = 0,
        utteranceEndTime: number = 0
    ): DetectorWord[] {
        if (!text) return [];

        const words = text.split(/\s+/).filter(word => word.length > 0);
        if (words.length === 0) return [];

        const utteranceDuration = utteranceEndTime - utteranceStartTime;
        const avgWordDuration = utteranceDuration / words.length;

        return words.map((word, index) => {
            const wordStart = utteranceStartTime + index * avgWordDuration;
            const wordEnd = wordStart + avgWordDuration;
            return {
                text: word,
                start: wordStart,
                end: wordEnd,
                wordIndex: index,
            };
        });
    }

    /**
     * Extract sentence texts from sentence endings with precise timestamps.
     */
    private extractSentencesFromEndings(
        _fullText: string,
        sentenceEndings: SentenceEndingWord[],
        allWords: DetectorWord[]
    ): MergerSentence[] {
        if (sentenceEndings.length === 0) {
            return [];
        }

        const sentences: MergerSentence[] = [];
        let lastEndIndex = 0;

        sentenceEndings.forEach((endingWord, sentenceIndex) => {
            const startWordIndex = lastEndIndex;
            const endWordIndex = endingWord.wordIndex;

            const sentenceWords = allWords.slice(startWordIndex, endWordIndex + 1);
            const sentenceText = sentenceWords.map(w => w.text).join(' ');

            const startTime = sentenceWords[0]?.start || 0;
            const endTime = sentenceWords[sentenceWords.length - 1]?.end || 0;

            sentences.push({
                id: `sentence_${Date.now()}_${sentenceIndex}`,
                text: sentenceText.trim(),
                startTime,
                endTime,
                startWordIndex,
                endWordIndex,
                wordCount: sentenceWords.length,
                words: sentenceWords,
                detectionMethod: endingWord.sentenceMetadata?.detectionMethod || 'nlp',
                isMature: false,
            });

            lastEndIndex = endWordIndex + 1;
        });

        return sentences;
    }

    /**
     * Determine which sentences are mature (can be finalized).
     * A sentence is mature when it has at least one following sentence.
     */
    private determineMatureSentences(
        sentences: MergerSentence[],
        utterance: Utterance,
        sentenceEndings: SentenceEndingWord[]
    ): MergerSentence[] {
        if (!sentences || sentences.length === 0) {
            return [];
        }

        if (this.config.skipSingleSentences && sentences.length === 1) {
            if (this.config.debug) {
                console.log('[UtteranceMerger] Skipping single sentence (no following sentence)');
            }
            return [];
        }

        const matureSentences: MergerSentence[] = [];

        if (sentences.length >= 2) {
            const sentencesToMature = sentences.slice(0, -1);

            sentencesToMature.forEach((sentence, index) => {
                const sentenceEndingWord = sentenceEndings[index];

                const matureSentence: MergerSentence = {
                    ...sentence,
                    utteranceId: utterance.id,
                    timestamp: utterance.timestamp,
                    wordEndTime:
                        sentence.endTime ||
                        (sentenceEndingWord ? sentenceEndingWord.end : utterance.endTime),
                    isMature: true,
                    sentenceEndingWord,
                };

                // Check for duplicates
                const existingSentence = this.matureSentences.find(
                    existing =>
                        existing.text === matureSentence.text &&
                        Math.abs((existing.wordEndTime ?? 0) - (matureSentence.wordEndTime ?? 0)) < 0.1
                );

                if (!existingSentence) {
                    matureSentences.push(matureSentence);
                    this.matureSentences.push(matureSentence);
                    this.stats.matureSentencesCreated++;
                } else {
                    matureSentences.push(existingSentence);
                }
            });

            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Created ${matureSentences.length} mature sentences from ${sentences.length} total`
                );
            }
        }

        return matureSentences;
    }

    /**
     * Update mature cursor time based on mature sentences.
     */
    private updateMatureCursor(newMatureSentences: MergerSentence[], _currentEndTime: number): void {
        if (newMatureSentences.length === 0) return;

        const allMatureSentencesWithTimestamps = this.matureSentences.filter(s => s.wordEndTime);

        let newCursorTime = this.matureCursorTime;

        if (allMatureSentencesWithTimestamps.length >= 1) {
            const lastMatureSentence =
                allMatureSentencesWithTimestamps[allMatureSentencesWithTimestamps.length - 1];
            newCursorTime = lastMatureSentence.wordEndTime!;

            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Using last mature sentence end time: ${newCursorTime.toFixed(2)}s`
                );
                console.log(`[UtteranceMerger] Sentence: "${lastMatureSentence.text}"`);
            }
        }

        if (newCursorTime > this.matureCursorTime) {
            const previousTime = this.matureCursorTime;
            this.matureCursorTime = newCursorTime;
            this.stats.matureCursorUpdates++;

            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Cursor advanced from ${previousTime.toFixed(2)}s to ${newCursorTime.toFixed(2)}s`
                );
            }
        }
    }

    /**
     * Get the current mature text (finalized sentences).
     */
    getMatureText(): string {
        const uniqueSentences: MergerSentence[] = [];
        const seenTexts = new Set<string>();

        for (const sentence of this.matureSentences) {
            if (!seenTexts.has(sentence.text)) {
                uniqueSentences.push(sentence);
                seenTexts.add(sentence.text);
            }
        }

        return uniqueSentences.map(sentence => sentence.text).join(' ');
    }

    /**
     * Get the current working text (latest utterance).
     */
    getCurrentText(): string {
        return this.currentUtteranceText;
    }

    /**
     * Get full accumulated transcription text.
     */
    getFullText(): string {
        const matureText = this.getMatureText();
        const currentText = this.getCurrentText();

        if (matureText && currentText.startsWith(matureText)) {
            return currentText;
        }

        return matureText ? `${matureText} ${currentText}`.trim() : currentText;
    }

    /**
     * Get the immature text (text after mature cursor).
     */
    getImmatureText(): string {
        const matureText = this.getMatureText();
        const currentText = this.getCurrentText();

        if (currentText.startsWith(matureText)) {
            return currentText.substring(matureText.length).trim();
        }

        return currentText;
    }

    /**
     * Create a result object for external consumption.
     */
    private createResult(sentenceResult?: SentenceDetectionResult | null): MergerResult {
        return {
            matureText: this.getMatureText(),
            currentText: this.getCurrentText(),
            fullText: this.getFullText(),
            immatureText: this.getImmatureText(),
            matureCursorTime: this.matureCursorTime,
            totalSentences: sentenceResult?.totalSentences || 0,
            matureSentences: sentenceResult?.matureSentences || [],
            allMatureSentences: this.matureSentences,
            pendingSentence: this.pendingSentence,
            usedPreciseTimestamps: sentenceResult?.usedPreciseTimestamps || false,
            stats: { ...this.stats },
            utteranceCount: this.utterances.length,
            lastUtteranceText: this.currentUtteranceText,
        };
    }

    /**
     * Check if a sentence text ends with proper punctuation.
     */
    isSentenceCompleteByPunctuation(text: string): boolean {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        if (trimmed.endsWith('...')) return false;
        return /[.!?]$/.test(trimmed);
    }

    /**
     * Finalize the currently pending last-ended sentence due to inactivity timeout.
     * Called externally when VAD detects extended silence or a timer expires.
     */
    finalizePendingSentenceByTimeout(): MergerResult | null {
        if (!this.config.enableTimeoutFinalization || !this.pendingSentence) {
            return null;
        }

        const candidate = this.pendingSentence;

        // Only finalize if sentence ends with proper punctuation
        if (!this.isSentenceCompleteByPunctuation(candidate.text)) {
            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Skipping timeout finalization -- sentence doesn't end with proper punctuation: "${candidate.text}"`
                );
            }
            return null;
        }

        // Avoid duplicates
        const exists = this.matureSentences.find(
            existing =>
                existing.text === candidate.text &&
                Math.abs((existing.wordEndTime ?? 0) - (candidate.wordEndTime ?? 0)) < 0.1
        );

        if (!exists) {
            const matured: MergerSentence = { ...candidate, isMature: true };
            this.matureSentences.push(matured);
            this.stats.matureSentencesCreated++;
            this.updateMatureCursor([matured], candidate.wordEndTime || 0);
            if (this.config.debug) {
                console.log(
                    `[UtteranceMerger] Timeout finalized sentence: "${candidate.text}" @ ${candidate.wordEndTime?.toFixed?.(2) ?? candidate.wordEndTime}s`
                );
            }
        }

        this.pendingSentence = null;
        return this.createResult();
    }

    /**
     * Get the current mature cursor time (used by WindowBuilder).
     */
    getMatureCursorTime(): number {
        return this.matureCursorTime;
    }

    /**
     * Get the pending sentence (if any).
     */
    getPendingSentence(): MergerSentence | null {
        return this.pendingSentence;
    }

    /**
     * Reset the merger state.
     */
    reset(): void {
        this.utterances = [];
        this.matureSentences = [];
        this.currentUtteranceText = '';
        this.matureCursorTime = 0;
        this.pendingSentence = null;
        this.stats = {
            utterancesProcessed: 0,
            sentencesDetected: 0,
            matureSentencesCreated: 0,
            matureCursorUpdates: 0,
        };

        this.sentenceDetector.reset();

        if (this.config.debug) {
            console.log('[UtteranceMerger] Reset complete');
        }
    }

    /**
     * Update configuration.
     */
    updateConfig(newConfig: Partial<UtteranceBasedMergerConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (
            newConfig.debug !== undefined ||
            newConfig.minSentenceLength !== undefined ||
            newConfig.useNLP !== undefined
        ) {
            this.sentenceDetector.updateConfig({
                useNLP: this.config.useNLP,
                debug: this.config.debug,
                minSentenceLength: this.config.minSentenceLength,
            });
        }

        if (this.config.debug) {
            console.log('[UtteranceMerger] Config updated:', this.config);
        }
    }

    /**
     * Get current statistics.
     */
    getStats(): MergerStats & { sentenceDetectorStats: ReturnType<SentenceBoundaryDetector['getStats']>; matureSentenceCount: number; utteranceCount: number } {
        return {
            ...this.stats,
            sentenceDetectorStats: this.sentenceDetector.getStats(),
            matureSentenceCount: this.matureSentences.length,
            utteranceCount: this.utterances.length,
        };
    }
}
