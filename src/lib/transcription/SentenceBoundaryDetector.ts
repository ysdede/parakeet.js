/**
 * SentenceBoundaryDetector.ts
 *
 * Utility class for detecting sentence boundaries using winkNLP.
 * Provides both NLP-based and heuristic fallback methods for sentence
 * boundary detection in transcription data.
 *
 * Ported from parakeet-ui/src/utils/SentenceBoundaryDetector.js to TypeScript.
 */

import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

/** A word object with text and timing information */
export interface DetectorWord {
    text: string;
    start: number;
    end: number;
    wordIndex?: number;
    confidence?: number;
}

/** A detected sentence with position metadata */
export interface DetectedSentence {
    text: string;
    endPos: number;
}

/** A word that ends a sentence, with metadata */
export interface SentenceEndingWord extends DetectorWord {
    wordIndex: number;
    sentenceMetadata?: {
        sentenceText: string;
        detectionMethod: 'nlp' | 'heuristic';
    };
}

/** Word position mapping for text reconstruction */
interface WordPosition {
    wordIndex: number;
    originalWord: DetectorWord;
    textStartPos: number;
    textEndPos: number;
}

/** Configuration for SentenceBoundaryDetector */
export interface SentenceBoundaryDetectorConfig {
    /** Whether to use winkNLP or fall back to heuristic (default: true) */
    useNLP: boolean;
    /** Enable debug logging (default: false) */
    debug: boolean;
    /** Max number of cached NLP results (default: 100) */
    cacheSize: number;
    /** Minimum characters for a valid sentence (default: 3) */
    minSentenceLength: number;
    /** Number of previous sentences to include as context for incremental NLP (default: 8) */
    nlpContextSentences: number;
    /** Max sentence endings retained in memory (default: 20) */
    maxRetainedSentences: number;
}

export class SentenceBoundaryDetector {
    private config: SentenceBoundaryDetectorConfig;
    private nlp: any | null = null;
    private cache: Map<string, DetectedSentence[]> = new Map();
    private lastProcessedWordCount: number = 0;
    private lastSentenceEndings: SentenceEndingWord[] = [];
    private lastWordsCache: DetectorWord[] = [];

    constructor(config: Partial<SentenceBoundaryDetectorConfig> = {}) {
        this.config = {
            useNLP: true,
            debug: false,
            cacheSize: 100,
            minSentenceLength: 3,
            nlpContextSentences: 8,
            maxRetainedSentences: 20,
            ...config,
        };

        this.initializeNLP();
    }

    /**
     * Initialize winkNLP with sentence boundary detection pipeline.
     */
    private initializeNLP(): void {
        try {
            // Use only sentence boundary detection for optimal performance
            this.nlp = winkNLP(model, ['sbd']);
            if (this.config.debug) {
                console.log('[SentenceDetector] winkNLP initialized successfully');
            }
        } catch (error) {
            console.warn('[SentenceDetector] Failed to initialize winkNLP:', error);
            console.warn('[SentenceDetector] Falling back to heuristic sentence detection');
            this.config.useNLP = false;
        }
    }

    /**
     * Detect sentence boundaries in a text and return sentence ending positions.
     * @param words - Array of word objects with {text, start, end} properties
     * @returns Array of words that end sentences, with additional metadata
     */
    detectSentenceEndings(words: DetectorWord[]): SentenceEndingWord[] {
        if (!words || words.length === 0) {
            this.reset();
            return [];
        }

        // If the new word list is shorter, it might be a completely new transcript. Reset.
        if (words.length < this.lastProcessedWordCount) {
            if (this.config.debug) {
                console.log(
                    `[SentenceDetector] Word list shrank from ${this.lastProcessedWordCount} to ${words.length}, resetting.`
                );
            }
            this.reset();
        }

        if (!this.config.useNLP || !this.nlp) {
            return this.detectSentenceEndingsHeuristic(words);
        }

        try {
            return this.detectSentenceEndingsNLP(words);
        } catch (error) {
            if (this.config.debug) {
                console.warn('[SentenceDetector] NLP detection failed, falling back to heuristic:', error);
            }
            this.reset();
            return this.detectSentenceEndingsHeuristic(words);
        }
    }

    /**
     * NLP-based sentence boundary detection using winkNLP with incremental processing.
     */
    private detectSentenceEndingsNLP(words: DetectorWord[]): SentenceEndingWord[] {
        // Condition for incremental update
        const canIncrement =
            this.lastProcessedWordCount > 0 &&
            words.length > this.lastProcessedWordCount &&
            this.lastWordsCache.length > 0 &&
            words[0] === this.lastWordsCache[0] &&
            words[this.lastProcessedWordCount - 1] === this.lastWordsCache[this.lastProcessedWordCount - 1];

        if (canIncrement) {
            // --- Incremental path ---
            const numPrevSentences = this.lastSentenceEndings.length;
            const contextSentenceCount = this.config.nlpContextSentences;
            let contextIndex: number;

            if (numPrevSentences > contextSentenceCount) {
                const firstReprocessSentenceIdx = numPrevSentences - contextSentenceCount;
                const lastHistoricSentence = this.lastSentenceEndings[firstReprocessSentenceIdx - 1];
                contextIndex = lastHistoricSentence.wordIndex + 1;
            } else {
                const CONTEXT_WORDS = 15;
                contextIndex = Math.max(0, this.lastProcessedWordCount - CONTEXT_WORDS);
            }

            const wordsToProcess = words.slice(contextIndex);
            const contextStartTime = wordsToProcess[0]?.start ?? 0;

            // Retain endings safely before the reprocessing window
            const retainedEndings = this.lastSentenceEndings.filter(e => e.end < contextStartTime);

            if (this.config.debug) {
                console.log(
                    `[SentenceDetector] Incremental: Reprocessing from word ${contextIndex} (${wordsToProcess.length} words). Retaining ${retainedEndings.length} endings.`
                );
            }

            const newEndingWordsResult = this.performNLP(wordsToProcess);

            // Remap wordIndex to be global
            const newEndingWords: SentenceEndingWord[] = newEndingWordsResult.map(word => ({
                ...word,
                wordIndex: word.wordIndex + contextIndex,
            }));

            let combinedEndings = [...retainedEndings, ...newEndingWords];

            // Trim to max retained sentences
            if (combinedEndings.length > this.config.maxRetainedSentences) {
                combinedEndings = combinedEndings.slice(-this.config.maxRetainedSentences);
            }

            this.lastSentenceEndings = combinedEndings;
            this.lastProcessedWordCount = words.length;
            this.lastWordsCache = words;

            return combinedEndings;
        } else {
            // --- Full processing path ---
            if (this.config.debug) {
                const reason = this.lastProcessedWordCount === 0 ? 'first run' : 'transcript diverged';
                console.log(`[SentenceDetector] Full: processing all ${words.length} words (${reason}).`);
            }

            this.reset();

            let allEndingWords = this.performNLP(words);

            if (allEndingWords.length > this.config.maxRetainedSentences) {
                allEndingWords = allEndingWords.slice(-this.config.maxRetainedSentences);
            }

            this.lastSentenceEndings = allEndingWords;
            this.lastProcessedWordCount = words.length;
            this.lastWordsCache = words;

            return allEndingWords;
        }
    }

    /**
     * Performs stateless NLP sentence detection on a given array of words.
     */
    private performNLP(words: DetectorWord[]): SentenceEndingWord[] {
        if (!words || words.length === 0) {
            return [];
        }

        const { fullText, wordPositions } = this.reconstructTextWithPositions(words);

        // Check cache
        const cacheKey = this.generateCacheKey(fullText);
        if (this.cache.has(cacheKey)) {
            const cachedResult = this.cache.get(cacheKey)!;
            return this.mapSentenceEndingsToWords(cachedResult, words, wordPositions);
        }

        // Process with winkNLP
        const doc = this.nlp.readDoc(fullText);
        const sentences: DetectedSentence[] = [];

        const sentenceTexts: string[] = doc.sentences().out();
        let currentPos = 0;

        sentenceTexts.forEach((sentenceText: string) => {
            const sentenceStart = fullText.indexOf(sentenceText, currentPos);
            if (sentenceStart !== -1) {
                const sentenceEnd = sentenceStart + sentenceText.length;
                sentences.push({
                    text: sentenceText,
                    endPos: sentenceEnd,
                });
                currentPos = sentenceEnd;
            }
        });

        // Cache the result
        this.addToCache(cacheKey, sentences);

        return this.mapSentenceEndingsToWords(sentences, words, wordPositions);
    }

    /**
     * Fallback heuristic sentence boundary detection.
     */
    private detectSentenceEndingsHeuristic(words: DetectorWord[]): SentenceEndingWord[] {
        return words
            .filter(word => /[.?!]$/.test(word.text))
            .map((word, _idx) => {
                const wordIndex = words.indexOf(word);
                return {
                    ...word,
                    wordIndex,
                    sentenceMetadata: {
                        sentenceText: word.text,
                        detectionMethod: 'heuristic' as const,
                    },
                };
            });
    }

    /**
     * Reconstruct full text from words while maintaining position mapping.
     */
    private reconstructTextWithPositions(
        words: DetectorWord[]
    ): { fullText: string; wordPositions: WordPosition[] } {
        let fullText = '';
        const wordPositions: WordPosition[] = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word || typeof word.text !== 'string') continue;

            const currentWordText = word.text;
            let needsSpace = false;

            if (i > 0) {
                const prevWord = words[i - 1];
                if (prevWord && typeof prevWord.text === 'string') {
                    needsSpace = true;
                    // Spacing rules matching TranscriptionMerger conventions
                    const noSpaceBefore = /^[.,!?;:)'"\]\]}]/.test(currentWordText);
                    if (noSpaceBefore) needsSpace = false;
                    if (currentWordText.startsWith("'")) {
                        const commonContractions = ["'s", "'t", "'re", "'ve", "'m", "'ll", "'d"];
                        if (commonContractions.includes(currentWordText.toLowerCase())) needsSpace = false;
                    }
                    if (
                        currentWordText.toLowerCase() === "n't" &&
                        prevWord.text.toLowerCase().endsWith('n')
                    )
                        needsSpace = false;
                }
            }

            if (needsSpace) {
                fullText += ' ';
            }

            const wordStartPos = fullText.length;
            fullText += currentWordText;
            const wordEndPos = fullText.length;

            wordPositions.push({
                wordIndex: i,
                originalWord: word,
                textStartPos: wordStartPos,
                textEndPos: wordEndPos,
            });
        }

        return { fullText, wordPositions };
    }

    /**
     * Map NLP-detected sentence endings back to original word objects.
     */
    private mapSentenceEndingsToWords(
        sentences: DetectedSentence[],
        originalWords: DetectorWord[],
        wordPositions: WordPosition[]
    ): SentenceEndingWord[] {
        const sentenceEndingWords: SentenceEndingWord[] = [];

        sentences.forEach((sentence) => {
            const sentenceEndPos = sentence.endPos;

            let closestWordIndex = -1;
            let minDistance = Infinity;

            // Find the word whose end position is nearest to the sentence's detected end
            wordPositions.forEach((wordPos) => {
                const distance = sentenceEndPos - wordPos.textEndPos;
                if (distance >= 0 && distance < minDistance) {
                    minDistance = distance;
                    closestWordIndex = wordPos.wordIndex;
                }
            });

            // Fallback to absolute closest
            if (closestWordIndex === -1) {
                if (this.config.debug) {
                    console.warn(
                        `[SentenceDetector] Could not find a word ending before sentence end position ${sentenceEndPos}. Falling back to absolute closest match.`
                    );
                }
                wordPositions.forEach((wordPos) => {
                    const distance = Math.abs(sentenceEndPos - wordPos.textEndPos);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestWordIndex = wordPos.wordIndex;
                    }
                });
            }

            if (closestWordIndex !== -1 && closestWordIndex < originalWords.length) {
                const endingWord = originalWords[closestWordIndex];
                sentenceEndingWords.push({
                    ...endingWord,
                    wordIndex: closestWordIndex,
                    sentenceMetadata: {
                        sentenceText: sentence.text,
                        detectionMethod: 'nlp',
                    },
                });
            }
        });

        if (this.config.debug) {
            console.log(
                `[SentenceDetector] NLP detected ${sentences.length} sentences, mapped to ${sentenceEndingWords.length} ending words`
            );
        }

        return sentenceEndingWords;
    }

    /**
     * Generate a simple hash for caching.
     */
    private generateCacheKey(text: string): string {
        let hash = 0;
        if (text.length === 0) return hash.toString();
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Add result to cache with LRU-like size management.
     */
    private addToCache(key: string, value: DetectedSentence[]): void {
        if (this.cache.size >= this.config.cacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    /**
     * Update configuration.
     */
    updateConfig(newConfig: Partial<SentenceBoundaryDetectorConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (newConfig.useNLP !== undefined && newConfig.useNLP && !this.nlp) {
            this.initializeNLP();
        }

        if (this.config.debug) {
            console.log('[SentenceDetector] Config updated:', this.config);
        }
    }

    /**
     * Clear the cache and reset incremental state.
     */
    reset(): void {
        this.cache.clear();
        this.lastProcessedWordCount = 0;
        this.lastSentenceEndings = [];
        this.lastWordsCache = [];
        if (this.config.debug) {
            console.log('[SentenceDetector] Reset: Cache and incremental state cleared');
        }
    }

    /**
     * Get current statistics.
     */
    getStats(): { nlpAvailable: boolean; usingNLP: boolean; cacheSize: number; maxCacheSize: number } {
        return {
            nlpAvailable: !!this.nlp,
            usingNLP: this.config.useNLP && !!this.nlp,
            cacheSize: this.cache.size,
            maxCacheSize: this.config.cacheSize,
        };
    }
}
