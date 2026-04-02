import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

function heuristicSplitTextIntoSentences(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];
  return (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function splitTextIntoSentences(text, config = {}) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];

  if (config.useNLP === false) {
    return heuristicSplitTextIntoSentences(trimmed);
  }

  try {
    const nlp = winkNLP(model, ['sbd']);
    const doc = nlp.readDoc(trimmed);
    const sentences = doc.sentences().out()
      .map((sentence) => String(sentence).trim())
      .filter((sentence) => sentence.length > 0);
    if (sentences.length > 0) {
      return sentences;
    }
  } catch {
    // Fall through to the shared heuristic if winkNLP is unavailable.
  }

  return heuristicSplitTextIntoSentences(trimmed);
}

export class SentenceBoundaryDetector {
  constructor(config = {}) {
    this.config = {
      useNLP: true,
      debug: false,
      cacheSize: 100,
      minSentenceLength: 3,
      nlpContextSentences: 5,
      maxRetainedSentences: 20,
      ...config,
    };

    this.nlp = null;
    this.cache = new Map();
    this.lastProcessedWordCount = 0;
    this.lastSentenceEndings = [];
    this.lastWordsCache = [];

    this.initializeNLP();
  }

  initializeNLP() {
    try {
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

  detectSentenceEndings(words) {
    if (!Array.isArray(words) || words.length === 0) {
      this.reset();
      return [];
    }

    if (words.length < this.lastProcessedWordCount) {
      if (this.config.debug) {
        console.log(
          `[SentenceDetector] Word list shrank from ${this.lastProcessedWordCount} to ${words.length}, resetting.`,
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

  detectSentenceEndingsNLP(words) {
    const canIncrement =
      this.lastProcessedWordCount > 0 &&
      words.length > this.lastProcessedWordCount &&
      this.lastWordsCache.length > 0 &&
      words[0] === this.lastWordsCache[0] &&
      words[this.lastProcessedWordCount - 1] === this.lastWordsCache[this.lastProcessedWordCount - 1];

    if (canIncrement) {
      const numPrevSentences = this.lastSentenceEndings.length;
      const contextSentenceCount = this.config.nlpContextSentences;
      let contextIndex = 0;

      if (numPrevSentences > 0) {
        const sentencesToInclude = Math.min(numPrevSentences, contextSentenceCount);
        const firstReprocessSentenceIdx = numPrevSentences - sentencesToInclude;

        if (firstReprocessSentenceIdx > 0) {
          const oldestContextSentence = this.lastSentenceEndings[firstReprocessSentenceIdx - 1];
          contextIndex = oldestContextSentence.wordIndex + 1;

          if (this.config.debug) {
            console.log(
              `[SentenceDetector] Incremental: Using ${sentencesToInclude} sentences context, starting from word ${contextIndex}`,
            );
          }
        } else if (this.config.debug) {
          console.log(
            `[SentenceDetector] Incremental: Few sentences (${numPrevSentences}), reprocessing all`,
          );
        }
      } else if (this.config.debug) {
        console.log(
          `[SentenceDetector] Incremental: No previous sentences, processing all ${words.length} words`,
        );
      }

      const wordsToProcess = words.slice(contextIndex);
      const contextStartTime = wordsToProcess[0]?.start ?? 0;
      const retainedEndings = this.lastSentenceEndings.filter((ending) => ending.end < contextStartTime);
      const newEndingWords = this.performNLP(wordsToProcess).map((word) => ({
        ...word,
        wordIndex: word.wordIndex + contextIndex,
      }));

      let combinedEndings = [...retainedEndings, ...newEndingWords];
      if (combinedEndings.length > this.config.maxRetainedSentences) {
        combinedEndings = combinedEndings.slice(-this.config.maxRetainedSentences);
      }

      this.lastSentenceEndings = combinedEndings;
      this.lastProcessedWordCount = words.length;
      this.lastWordsCache = words;

      return combinedEndings;
    }

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

  performNLP(words) {
    if (!Array.isArray(words) || words.length === 0) {
      return [];
    }

    const { fullText, wordPositions } = this.reconstructTextWithPositions(words);
    const cacheKey = this.generateCacheKey(fullText);
    if (this.cache.has(cacheKey)) {
      return this.mapSentenceEndingsToWords(this.cache.get(cacheKey), words, wordPositions);
    }

    const doc = this.nlp.readDoc(fullText);
    const sentences = [];
    const sentenceTexts = doc.sentences().out();
    let currentPos = 0;

    sentenceTexts.forEach((sentenceText) => {
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

    this.addToCache(cacheKey, sentences);
    return this.mapSentenceEndingsToWords(sentences, words, wordPositions);
  }

  detectSentenceEndingsHeuristic(words) {
    const results = [];
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (/[.?!]$/.test(word.text)) {
        results.push({
          ...word,
          wordIndex: i,
          sentenceMetadata: {
            sentenceText: word.text,
            detectionMethod: 'heuristic',
          },
        });
      }
    }
    return results;
  }

  reconstructTextWithPositions(words) {
    let fullText = '';
    const wordPositions = [];

    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (!word || typeof word.text !== 'string') continue;

      const currentWordText = word.text;
      let needsSpace = false;

      if (i > 0) {
        const prevWord = words[i - 1];
        if (prevWord && typeof prevWord.text === 'string') {
          needsSpace = true;
          const noSpaceBefore = /^[.,!?;:)'"\]\]}]/.test(currentWordText);
          if (noSpaceBefore) needsSpace = false;
          if (currentWordText.startsWith("'")) {
            const commonContractions = ["'s", "'t", "'re", "'ve", "'m", "'ll", "'d"];
            if (commonContractions.includes(currentWordText.toLowerCase())) needsSpace = false;
          }
          if (currentWordText.toLowerCase() === "n't" && prevWord.text.toLowerCase().endsWith('n')) {
            needsSpace = false;
          }
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

  mapSentenceEndingsToWords(sentences, originalWords, wordPositions) {
    const sentenceEndingWords = [];

    sentences.forEach((sentence) => {
      const sentenceEndPos = sentence.endPos;
      let closestWordIndex = -1;
      let minDistance = Infinity;

      wordPositions.forEach((wordPos) => {
        const distance = sentenceEndPos - wordPos.textEndPos;
        if (distance >= 0 && distance < minDistance) {
          minDistance = distance;
          closestWordIndex = wordPos.wordIndex;
        }
      });

      if (closestWordIndex === -1) {
        if (this.config.debug) {
          console.warn(
            `[SentenceDetector] Could not find a word ending before sentence end position ${sentenceEndPos}. Falling back to absolute closest match.`,
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

    return sentenceEndingWords;
  }

  generateCacheKey(text) {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i += 1) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return hash.toString();
  }

  addToCache(key, value) {
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.useNLP !== undefined && newConfig.useNLP && !this.nlp) {
      this.initializeNLP();
    }
  }

  reset() {
    this.cache.clear();
    this.lastProcessedWordCount = 0;
    this.lastSentenceEndings = [];
    this.lastWordsCache = [];
  }

  getStats() {
    return {
      nlpAvailable: !!this.nlp,
      usingNLP: this.config.useNLP && !!this.nlp,
      cacheSize: this.cache.size,
      maxCacheSize: this.config.cacheSize,
    };
  }
}

export default SentenceBoundaryDetector;
