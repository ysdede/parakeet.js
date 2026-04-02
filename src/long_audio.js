import { SentenceBoundaryDetector } from './sentence_boundary.js';

const AUTO_WINDOW_THRESHOLD_S = 180;
const MIN_CHUNK_LENGTH_S = 20;
const MAX_CHUNK_LENGTH_S = 180;
const AUTO_CHUNK_LENGTH_S = 90;
const AUTO_WINDOW_FALLBACK_OVERLAP_S = 10;
const AUTO_WINDOW_BALANCE_THRESHOLD_S = 120;
const AUTO_WINDOW_TARGET_FINAL_S = 60;
const AUTO_WINDOW_EPSILON_S = 1e-6;
const SEGMENT_DEDUP_TOLERANCE_S = 0.15;
const CURSOR_MIN_ADVANCE_S = 1.0;
const TAIL_RESCAN_TRIGGER_S = 1.5;
const TAIL_RESCAN_CONTEXT_S = 0.5;
const TAIL_RESCAN_MAX_WINDOW_S = 12.0;
const TAIL_RESCAN_ACTIVITY_THRESHOLD = 0.005;

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

function planWindowBounds(startS, audioDurationS, chunkLengthS) {
  const remainingS = Math.max(0, audioDurationS - startS);
  let windowLengthS = Math.min(chunkLengthS, remainingS);

  if (
    remainingS > chunkLengthS + AUTO_WINDOW_EPSILON_S &&
    remainingS <= AUTO_WINDOW_BALANCE_THRESHOLD_S + AUTO_WINDOW_EPSILON_S
  ) {
    // Near the tail, avoid leaving a tiny final fallback window by reserving
    // roughly 60 seconds for the last pass.
    windowLengthS = Math.max(
      MIN_CHUNK_LENGTH_S,
      Math.min(windowLengthS, remainingS - AUTO_WINDOW_TARGET_FINAL_S),
    );
  }

  const endS = Math.min(audioDurationS, startS + windowLengthS);
  const overlapS = Math.min(AUTO_WINDOW_FALLBACK_OVERLAP_S, Math.max(0, windowLengthS - 1));
  const advanceS = Math.max(1, windowLengthS - overlapS);

  return { endS, windowLengthS, advanceS };
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

function hasAudibleTailAudio(audio, samplingRate, startS, endS) {
  const startSample = Math.max(0, Math.floor(startS * samplingRate));
  const endSample = Math.min(audio.length, Math.ceil(endS * samplingRate));
  for (let i = startSample; i < endSample; ++i) {
    if (Math.abs(audio[i]) >= TAIL_RESCAN_ACTIVITY_THRESHOLD) {
      return true;
    }
  }
  return false;
}

async function recoverTrailingTailWords({
  audio,
  samplingRate,
  startS,
  endS,
  baseTimeOffset,
  words,
  transcribeWindow,
}) {
  if (!Array.isArray(words) || words.length === 0) {
    return words;
  }

  const lastWordEndS = Number(words[words.length - 1]?.end_time) - baseTimeOffset;
  if (!Number.isFinite(lastWordEndS)) {
    return words;
  }

  const trailingGapS = endS - lastWordEndS;
  if (trailingGapS < TAIL_RESCAN_TRIGGER_S) {
    return words;
  }
  if (!hasAudibleTailAudio(audio, samplingRate, lastWordEndS, endS)) {
    return words;
  }

  const tailStartS = Math.max(
    startS,
    Math.max(0, lastWordEndS - TAIL_RESCAN_CONTEXT_S),
    endS - TAIL_RESCAN_MAX_WINDOW_S,
  );
  if (tailStartS >= endS - AUTO_WINDOW_EPSILON_S) {
    return words;
  }

  const startSample = Math.max(0, Math.min(audio.length - 1, Math.floor(tailStartS * samplingRate)));
  const endSample = Math.max(startSample + 1, Math.min(audio.length, Math.ceil(endS * samplingRate)));
  const tailAudio = audio.subarray(startSample, endSample);
  const tailOutput = await transcribeWindow(tailAudio, baseTimeOffset + tailStartS);
  const tailWords = Array.isArray(tailOutput.words) ? tailOutput.words : [];
  if (tailWords.length === 0) {
    return words;
  }

  const recoveredLastWordEndS = Number(tailWords[tailWords.length - 1]?.end_time);
  const originalLastWordEndS = Number(words[words.length - 1]?.end_time);
  if (!Number.isFinite(recoveredLastWordEndS) || recoveredLastWordEndS <= originalLastWordEndS + AUTO_WINDOW_EPSILON_S) {
    return words;
  }

  return dedupeMergedWords([...words, ...tailWords]);
}

function toSentenceDetectorWords(words) {
  return words.map((word, index) => ({
    text: String(word?.text ?? ''),
    start: Number(word?.start_time ?? 0),
    end: Number(word?.end_time ?? 0),
    wordIndex: index,
    confidence: word?.confidence,
  })).filter((word) => word.text.length > 0);
}

function partitionWordsIntoSegments(words, detector = new SentenceBoundaryDetector()) {
  if (!Array.isArray(words) || words.length === 0) {
    return [];
  }

  const detectorWords = toSentenceDetectorWords(words);
  if (detectorWords.length === 0) {
    return [];
  }

  const sentenceEndings = detector.detectSentenceEndings(detectorWords);
  if (sentenceEndings.length === 0) {
    return [{
      words,
      text: joinTimedWords(words),
      timestamp: [words[0].start_time, words[words.length - 1].end_time],
    }];
  }

  const segments = [];
  let startIndex = 0;

  for (const ending of sentenceEndings) {
    const endIndex = ending.wordIndex;
    if (!Number.isInteger(endIndex) || endIndex < startIndex || endIndex >= words.length) {
      continue;
    }

    const sentenceWords = words.slice(startIndex, endIndex + 1);
    if (sentenceWords.length === 0) continue;
    segments.push({
      words: sentenceWords,
      text: joinTimedWords(sentenceWords),
      timestamp: [sentenceWords[0].start_time, sentenceWords[sentenceWords.length - 1].end_time],
    });
    startIndex = endIndex + 1;
  }

  if (startIndex < words.length) {
    const trailingWords = words.slice(startIndex);
    segments.push({
      words: trailingWords,
      text: joinTimedWords(trailingWords),
      timestamp: [trailingWords[0].start_time, trailingWords[trailingWords.length - 1].end_time],
    });
  }

  return segments;
}

function buildSegmentChunks(words, text = '', detector = new SentenceBoundaryDetector()) {
  if (!Array.isArray(words) || words.length === 0) {
    return text ? [{ text, timestamp: [0, 0] }] : [];
  }

  return partitionWordsIntoSegments(words, detector).map((segment) => ({
    text: segment.text,
    timestamp: segment.timestamp,
  }));
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

async function runAutoSentenceWindowing({
  audio,
  samplingRate,
  chunkLengthS,
  baseTimeOffset,
  transcribeWindow,
}) {
  const audioDurationS = audio.length / samplingRate;
  const maxWindows = Math.max(
    4,
    Math.ceil(Math.max(0, audioDurationS - chunkLengthS) / CURSOR_MIN_ADVANCE_S) + 2,
  );

  const finalizedSegments = [];
  let lastTextFallback = '';
  let startS = 0;

  for (let windowIndex = 0; windowIndex < maxWindows && startS < audioDurationS - AUTO_WINDOW_EPSILON_S; ++windowIndex) {
    const { endS, advanceS: fallbackAdvanceS } = planWindowBounds(startS, audioDurationS, chunkLengthS);
    const startSample = Math.max(0, Math.min(audio.length - 1, Math.floor(startS * samplingRate)));
    const endSample = Math.max(startSample + 1, Math.min(audio.length, Math.ceil(endS * samplingRate)));
    const windowAudio = audio.subarray(startSample, endSample);
    const isLastWindow = endS >= audioDurationS - AUTO_WINDOW_EPSILON_S;

    const output = await transcribeWindow(windowAudio, baseTimeOffset + startS);
    lastTextFallback = output.text ?? lastTextFallback;

    const currentWords = Array.isArray(output.words) ? output.words : [];
    let windowWords = dedupeMergedWords(currentWords);
    if (isLastWindow) {
      windowWords = await recoverTrailingTailWords({
        audio,
        samplingRate,
        startS,
        endS,
        baseTimeOffset,
        words: windowWords,
        transcribeWindow,
      });
    }
    const segments = partitionWordsIntoSegments(windowWords);

    if (isLastWindow) {
      for (const segment of segments) {
        appendFinalizedSegment(finalizedSegments, segment);
      }
      break;
    }

    if (segments.length > 1) {
      const readySegments = segments.slice(0, -1);
      const pendingSegment = segments[segments.length - 1];
      const pendingStartS = pendingSegment.timestamp[0];
      const pendingRelativeStartS = Math.max(0, pendingStartS - baseTimeOffset);
      if (pendingRelativeStartS >= startS + CURSOR_MIN_ADVANCE_S - AUTO_WINDOW_EPSILON_S) {
        for (const segment of readySegments) {
          appendFinalizedSegment(finalizedSegments, segment);
        }

        const nextStartS = Math.min(
          audioDurationS,
          Math.max(0, pendingStartS - baseTimeOffset),
        );
        if (nextStartS > startS + AUTO_WINDOW_EPSILON_S) {
          startS = nextStartS;
          continue;
        }
      }
    }

    const fallbackStartS = Math.min(audioDurationS, startS + fallbackAdvanceS);
    if (fallbackStartS <= startS + AUTO_WINDOW_EPSILON_S) {
      break;
    }
    startS = fallbackStartS;
  }

  const words = finalizedSegments.flatMap((segment) => segment.words);
  const text = words.length > 0 ? joinTimedWords(words) : String(lastTextFallback ?? '').trim();
  const chunks = finalizedSegments.map((segment) => ({
    text: segment.text,
    timestamp: segment.timestamp,
  }));

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

  let output = await model.transcribe(audio, sampleRate, {
    ...transcribeOptions,
    _skipAudioValidation: true,
    returnTimestamps: true,
    timeOffset,
  });
  accumulateMetrics(metricsAccumulator, output.metrics);
  let words = Array.isArray(output.words) ? output.words : [];
  words = await recoverTrailingTailWords({
    audio,
    samplingRate: sampleRate,
    startS: 0,
    endS: audioDurationS,
    baseTimeOffset: timeOffset,
    words,
    transcribeWindow,
  });
  const text = words.length > 0 ? joinTimedWords(words) : (output.utterance_text ?? '');
  if (!wantTimestampChunks) {
    return { text, metrics: finalizeMetrics(metricsAccumulator) };
  }

  return {
    text,
    words,
    chunks: wantWordTimestamps ? buildWordChunks(words) : buildSegmentChunks(words, text),
    metrics: finalizeMetrics(metricsAccumulator),
  };
}
