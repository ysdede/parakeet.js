const AUTO_WINDOW_THRESHOLD_S = 180;
const MIN_CHUNK_LENGTH_S = 20;
const MAX_CHUNK_LENGTH_S = 180;
const AUTO_CHUNK_LENGTH_S = 90;
const AUTO_WINDOW_FALLBACK_OVERLAP_S = 10;
const AUTO_WINDOW_EPSILON_S = 1e-6;
const SEGMENT_DEDUP_TOLERANCE_S = 0.15;
const CURSOR_MIN_ADVANCE_S = 1.0;
const CURSOR_GAP_THRESHOLD_S = 0.2;
const CURSOR_SNAP_WINDOW_S = 0.5;

function validateAudio(audio) {
  if (!(audio instanceof Float32Array || audio instanceof Float64Array)) {
    throw new TypeError('ParakeetModel.transcribeLongAudio expected audio to be Float32Array or Float64Array.');
  }
  for (let i = 0; i < audio.length; ++i) {
    if (!Number.isFinite(audio[i])) {
      throw new Error(`ParakeetModel.transcribeLongAudio expected finite audio samples; found ${audio[i]} at index ${i}.`);
    }
  }
}

function normalizeChunkLengthS(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }
  return Math.max(MIN_CHUNK_LENGTH_S, Math.min(MAX_CHUNK_LENGTH_S, num));
}

function createMetricsAccumulator(audioDurationS) {
  return {
    audioDurationS,
    preprocess_ms: 0,
    encode_ms: 0,
    decode_ms: 0,
    tokenize_ms: 0,
    total_ms: 0,
    cached_frames: 0,
    new_frames: 0,
    hasMetrics: false,
    hasMelCache: false,
  };
}

function addMetricValue(accumulator, key, value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    accumulator[key] += value;
  }
}

function accumulateMetrics(accumulator, metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return;
  }

  accumulator.hasMetrics = true;
  addMetricValue(accumulator, 'preprocess_ms', metrics.preprocess_ms);
  addMetricValue(accumulator, 'encode_ms', metrics.encode_ms);
  addMetricValue(accumulator, 'decode_ms', metrics.decode_ms);
  addMetricValue(accumulator, 'tokenize_ms', metrics.tokenize_ms);
  addMetricValue(accumulator, 'total_ms', metrics.total_ms);

  if (metrics.mel_cache && typeof metrics.mel_cache === 'object') {
    accumulator.hasMelCache = true;
    addMetricValue(accumulator, 'cached_frames', metrics.mel_cache.cached_frames);
    addMetricValue(accumulator, 'new_frames', metrics.mel_cache.new_frames);
  }
}

function finalizeMetrics(accumulator) {
  if (!accumulator?.hasMetrics) {
    return null;
  }

  const total_ms = accumulator.total_ms > 0
    ? accumulator.total_ms
    : accumulator.preprocess_ms + accumulator.encode_ms + accumulator.decode_ms + accumulator.tokenize_ms;

  const metrics = {
    preprocess_ms: accumulator.preprocess_ms,
    encode_ms: accumulator.encode_ms,
    decode_ms: accumulator.decode_ms,
    tokenize_ms: accumulator.tokenize_ms,
    total_ms,
    rtf: total_ms > 0 ? accumulator.audioDurationS / (total_ms / 1000) : 0,
  };

  if (accumulator.hasMelCache) {
    metrics.mel_cache = {
      cached_frames: accumulator.cached_frames,
      new_frames: accumulator.new_frames,
    };
  }

  return metrics;
}

function joinTimedWords(words) {
  let text = '';
  for (const word of words) {
    const part = word?.text ?? '';
    if (!part) continue;
    if (!text) {
      text = part;
    } else if (/^[,.;:!?)}\]]+$/.test(part)) {
      text += part;
    } else {
      text += ` ${part}`;
    }
  }
  return text;
}

function buildWordChunks(words) {
  return words.map((word) => ({
    text: word.text,
    timestamp: [word.start_time, word.end_time],
  }));
}

function normalizeMergedWordText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/^[("'“‘\[{]+/g, '')
    .replace(/[.,!?;:)"'”’\]}]+$/g, '')
    .trim();
}

function normalizeRawMergedWordText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .trim();
}

function dedupeMergedWords(words) {
  const merged = [];
  for (const word of words) {
    const prev = merged.at(-1);
    const prevText = normalizeMergedWordText(prev?.text);
    const wordText = normalizeMergedWordText(word?.text);

    if (
      prev &&
      prevText === wordText &&
      (
        prevText.length > 0 ||
        normalizeRawMergedWordText(prev.text) === normalizeRawMergedWordText(word.text)
      ) &&
      word.start_time < prev.end_time
    ) {
      const prevDuration = prev.end_time - prev.start_time;
      const nextDuration = word.end_time - word.start_time;
      if (nextDuration > prevDuration) {
        merged[merged.length - 1] = word;
      }
      continue;
    }
    merged.push(word);
  }
  return merged;
}

const STRONG_SENTENCE_END_REGEX = /[!?…](?:["')\]]+)?$/u;
const PERIOD_SENTENCE_END_REGEX = /\.(?:["')\]]+)?$/u;
const TRAILING_CLOSERS_REGEX = /["')\]]+$/gu;
const LEADING_OPENERS_REGEX = /^[("'“‘\[{]+/u;
const DOTTED_ACRONYM_REGEX = /^(?:[A-Z]\.){2,}$/;
const SINGLE_LETTER_ENUM_REGEX = /^[A-Z]\.$/;
const ROMAN_ENUM_REGEX = /^(?:[IVXLCDM]+)\.$/i;
const NUMERIC_ENUM_REGEX = /^\d+\.$/;
const FALLBACK_SEGMENT_GAP_S = 3.0;
const NON_BREAKING_PERIOD_WORDS = new Set([
  'mr.',
  'mrs.',
  'ms.',
  'dr.',
  'prof.',
  'sr.',
  'jr.',
  'vs.',
  'etc.',
  'e.g.',
  'i.e.',
]);

function stripTrailingClosers(text) {
  return String(text ?? '').replace(TRAILING_CLOSERS_REGEX, '');
}

function looksLikeSentenceStart(text) {
  const cleaned = String(text ?? '').replace(LEADING_OPENERS_REGEX, '');
  return /^[A-Z]/.test(cleaned);
}

function shouldEndSentenceAfterWord(currentWord, nextWord, gapS = 0) {
  if (!nextWord) return false;
  if (gapS >= FALLBACK_SEGMENT_GAP_S) return true;

  const currentText = String(currentWord?.text ?? '');
  if (!currentText) return false;
  if (STRONG_SENTENCE_END_REGEX.test(currentText)) return true;
  if (!PERIOD_SENTENCE_END_REGEX.test(currentText)) return false;

  const stripped = stripTrailingClosers(currentText);
  const lowered = stripped.toLowerCase();
  if (
    NON_BREAKING_PERIOD_WORDS.has(lowered) ||
    DOTTED_ACRONYM_REGEX.test(stripped) ||
    SINGLE_LETTER_ENUM_REGEX.test(stripped) ||
    ROMAN_ENUM_REGEX.test(stripped) ||
    NUMERIC_ENUM_REGEX.test(stripped)
  ) {
    return false;
  }

  return looksLikeSentenceStart(nextWord.text);
}

function partitionWordsIntoSegments(words) {
  if (!Array.isArray(words) || words.length === 0) {
    return [];
  }

  const segments = [];
  let current = [];
  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    current.push(word);

    const nextWord = words[i + 1] ?? null;
    const gapS = nextWord ? Math.max(0, nextWord.start_time - word.end_time) : 0;
    if (shouldEndSentenceAfterWord(word, nextWord, gapS)) {
      segments.push({
        words: current,
        text: joinTimedWords(current),
        timestamp: [current[0].start_time, current[current.length - 1].end_time],
      });
      current = [];
    }
  }

  if (current.length > 0) {
    segments.push({
      words: current,
      text: joinTimedWords(current),
      timestamp: [current[0].start_time, current[current.length - 1].end_time],
    });
  }

  return segments;
}

function buildSegmentChunks(words, text = '') {
  if (!Array.isArray(words) || words.length === 0) {
    return text ? [{ text, timestamp: [0, 0] }] : [];
  }

  return partitionWordsIntoSegments(words).map((segment) => ({
    text: segment.text,
    timestamp: segment.timestamp,
  }));
}

function flattenSegmentWords(segments) {
  return segments.flatMap((segment) => segment.words);
}

function mergePendingAndCurrentWords(pendingWords, currentWords) {
  const normalizedPendingWords = Array.isArray(pendingWords) ? pendingWords : [];
  const normalizedCurrentWords = Array.isArray(currentWords) ? currentWords : [];

  if (normalizedPendingWords.length === 0) {
    return dedupeMergedWords(normalizedCurrentWords);
  }
  if (normalizedCurrentWords.length === 0) {
    return dedupeMergedWords(normalizedPendingWords);
  }

  const pendingStart = normalizedPendingWords[0].start_time;
  const currentStart = normalizedCurrentWords[0].start_time;
  if (currentStart <= pendingStart + AUTO_WINDOW_EPSILON_S) {
    return dedupeMergedWords(normalizedCurrentWords);
  }

  return dedupeMergedWords([...normalizedPendingWords, ...normalizedCurrentWords]);
}

function normalizeSegmentText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isDuplicateFinalizedSegment(finalizedSegments, segment) {
  const normalized = normalizeSegmentText(segment.text);
  if (!normalized) return false;

  return finalizedSegments.some(
    (candidate) =>
      normalizeSegmentText(candidate.text) === normalized &&
      Math.abs(candidate.timestamp[1] - segment.timestamp[1]) < SEGMENT_DEDUP_TOLERANCE_S,
  );
}

function appendFinalizedSegment(finalizedSegments, segment) {
  if (!isDuplicateFinalizedSegment(finalizedSegments, segment)) {
    finalizedSegments.push(segment);
  }
}

function relocateCursorToNearbyGap(targetS, words) {
  let best = targetS;
  let bestDist = CURSOR_SNAP_WINDOW_S + 1;

  for (let i = 0; i < words.length - 1; ++i) {
    const current = words[i];
    const next = words[i + 1];
    const gapStart = current.end_time;
    const gapEnd = next.start_time;
    const gap = gapEnd - gapStart;
    if (gap < CURSOR_GAP_THRESHOLD_S) continue;

    for (const candidate of [gapStart, gapEnd]) {
      if (candidate + AUTO_WINDOW_EPSILON_S < targetS) continue;
      const dist = candidate - targetS;
      if (dist <= CURSOR_SNAP_WINDOW_S && dist < bestDist) {
        best = candidate;
        bestDist = dist;
      }
    }
  }

  return best;
}

async function runAutoSentenceWindowing({
  audio,
  samplingRate,
  chunkLengthS,
  baseTimeOffset,
  transcribeWindow,
}) {
  const audioDurationS = audio.length / samplingRate;
  const fallbackOverlapS = Math.min(AUTO_WINDOW_FALLBACK_OVERLAP_S, Math.max(0, chunkLengthS - 1));
  const fallbackAdvanceS = Math.max(1, chunkLengthS - fallbackOverlapS);
  const maxWindows = Math.max(
    4,
    Math.ceil(Math.max(0, audioDurationS - chunkLengthS) / CURSOR_MIN_ADVANCE_S) + 2,
  );

  const finalizedSegments = [];
  let pendingWords = [];
  let lastTextFallback = '';
  let startS = 0;
  let shouldMergePending = false;

  for (let windowIndex = 0; windowIndex < maxWindows && startS < audioDurationS - AUTO_WINDOW_EPSILON_S; ++windowIndex) {
    const endS = Math.min(audioDurationS, startS + chunkLengthS);
    const startSample = Math.max(0, Math.min(audio.length - 1, Math.floor(startS * samplingRate)));
    const endSample = Math.max(startSample + 1, Math.min(audio.length, Math.ceil(endS * samplingRate)));
    const windowAudio = audio.subarray(startSample, endSample);
    const isLastWindow = endS >= audioDurationS - AUTO_WINDOW_EPSILON_S;

    const output = await transcribeWindow(windowAudio, baseTimeOffset + startS);
    lastTextFallback = output.text ?? lastTextFallback;

    const currentWords = Array.isArray(output.words) ? output.words : [];
    const windowWords = shouldMergePending
      ? mergePendingAndCurrentWords(pendingWords, currentWords)
      : dedupeMergedWords(currentWords);
    const segments = partitionWordsIntoSegments(windowWords);

    if (isLastWindow) {
      for (const segment of segments) {
        appendFinalizedSegment(finalizedSegments, segment);
      }
      pendingWords = [];
      break;
    }

    if (segments.length > 1) {
      const pendingSegment = segments[segments.length - 1];
      const pendingStartS = pendingSegment.timestamp[0];
      const pendingRelativeStartS = Math.max(0, pendingStartS - baseTimeOffset);
      if (pendingRelativeStartS >= startS + CURSOR_MIN_ADVANCE_S - AUTO_WINDOW_EPSILON_S) {
        const readySegments = segments.slice(0, -1);
        for (const segment of readySegments) {
          appendFinalizedSegment(finalizedSegments, segment);
        }

        pendingWords = dedupeMergedWords(pendingSegment.words);
        const nextStartS = Math.min(
          audioDurationS,
          Math.max(0, relocateCursorToNearbyGap(pendingStartS, windowWords) - baseTimeOffset),
        );
        shouldMergePending = nextStartS > pendingRelativeStartS + AUTO_WINDOW_EPSILON_S;
        if (nextStartS > startS + AUTO_WINDOW_EPSILON_S) {
          startS = nextStartS;
          continue;
        }
      }
    }

    pendingWords = windowWords;
    shouldMergePending = true;

    const fallbackStartS = Math.min(audioDurationS, startS + fallbackAdvanceS);
    if (fallbackStartS <= startS + AUTO_WINDOW_EPSILON_S) {
      break;
    }
    startS = fallbackStartS;
  }

  const words = dedupeMergedWords([...flattenSegmentWords(finalizedSegments), ...pendingWords]);
  const text = words.length > 0 ? joinTimedWords(words) : String(lastTextFallback ?? '').trim();
  const chunks = buildSegmentChunks(words, text);

  return { text, words, chunks };
}

/**
 * @param {import('./parakeet.js').ParakeetModel} model
 * @param {Float32Array|Float64Array} audio
 * @param {number} sampleRate
 * @param {object} [opts]
 * @param {boolean|'word'} [opts.returnTimestamps=false]
 * @param {number} [opts.chunkLengthS=0]
 * @param {boolean} [opts.returnConfidences=false]
 * @param {boolean} [opts.debug=false]
 * @param {boolean} [opts.enableProfiling=true]
 * @param {number} [opts.temperature=1.0]
 * @param {boolean} [opts.skipCMVN=false]
 * @param {number} [opts.timeOffset=0]
 * @returns {Promise<{text: string, chunks?: Array<{ text: string, timestamp: [number, number] }>, words?: Array<{ text: string, start_time: number, end_time: number, confidence?: number }>}>}
 */
export async function transcribeLongAudioWithChunks(model, audio, sampleRate = 16000, opts = {}) {
  validateAudio(audio);
  if (typeof sampleRate !== 'number' || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error('ParakeetModel.transcribeLongAudio expected `sampleRate` to be a positive finite number.');
  }

  const {
    returnTimestamps = false,
    chunkLengthS = 0,
    timeOffset = 0,
    ...transcribeOptions
  } = opts;
  if (typeof timeOffset !== 'number' || !Number.isFinite(timeOffset) || timeOffset < 0) {
    throw new Error('ParakeetModel.transcribeLongAudio expected `timeOffset` to be a finite non-negative number.');
  }

  const wantWordTimestamps = returnTimestamps === 'word';
  const wantTimestampChunks = returnTimestamps === true || wantWordTimestamps;
  const normalizedChunkLengthS = normalizeChunkLengthS(chunkLengthS);
  const audioDurationS = audio.length / sampleRate;
  const autoWindowing = normalizedChunkLengthS <= 0 && audioDurationS > AUTO_WINDOW_THRESHOLD_S;
  const effectiveChunkLengthS = normalizedChunkLengthS > 0
    ? normalizedChunkLengthS
    : autoWindowing
      ? AUTO_CHUNK_LENGTH_S
      : 0;
  const metricsAccumulator = createMetricsAccumulator(audioDurationS);

  const transcribeWindow = async (windowAudio, windowTimeOffset) => {
    const output = await model.transcribe(windowAudio, sampleRate, {
      ...transcribeOptions,
      _skipAudioValidation: true,
      returnTimestamps: true,
      timeOffset: windowTimeOffset,
    });
    accumulateMetrics(metricsAccumulator, output.metrics);
    return {
      text: output.utterance_text ?? '',
      words: Array.isArray(output.words) ? output.words : [],
    };
  };

  if (effectiveChunkLengthS > 0) {
    const merged = await runAutoSentenceWindowing({
      audio,
      samplingRate: sampleRate,
      chunkLengthS: effectiveChunkLengthS,
      baseTimeOffset: timeOffset,
      transcribeWindow,
    });

    const result = { text: merged.text, metrics: finalizeMetrics(metricsAccumulator) };
    if (wantTimestampChunks) {
      result.words = merged.words;
      result.chunks = wantWordTimestamps ? buildWordChunks(merged.words) : merged.chunks;
    }
    return result;
  }

  const output = await model.transcribe(audio, sampleRate, {
    ...transcribeOptions,
    _skipAudioValidation: true,
    returnTimestamps: wantTimestampChunks,
    timeOffset,
  });
  accumulateMetrics(metricsAccumulator, output.metrics);
  const text = output.utterance_text ?? '';
  if (!wantTimestampChunks) {
    return { text, metrics: finalizeMetrics(metricsAccumulator) };
  }

  const words = Array.isArray(output.words) ? output.words : [];
  return {
    text,
    words,
    chunks: wantWordTimestamps ? buildWordChunks(words) : buildSegmentChunks(words, text),
    metrics: finalizeMetrics(metricsAccumulator),
  };
}
