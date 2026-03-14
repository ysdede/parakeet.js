/**
 * HuggingFace Speech Dataset Utilities
 * 
 * This module provides utilities for fetching speech samples from HuggingFace datasets
 * for testing ASR models. It's designed for demo/testing purposes.
 * 
 * Usage:
 *   import { fetchRandomSample, SPEECH_DATASETS } from './utils/speechDatasets';
 *   
 *   const sample = await fetchRandomSample('en');
 *   // sample = { audioBuffer: ArrayBuffer, transcription: string, ... }
 */

/**
 * Speech dataset configurations for different languages.
 * Uses datasets with HuggingFace datasets-server API support.
 */
export const SPEECH_DATASETS = {
  en: { 
    displayName: 'English', 
    dataset: 'MLCommons/peoples_speech',
    config: 'clean',
    split: 'test',
    textField: 'text',
  },
  fr: { 
    displayName: 'French', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'french',
    split: 'test',
    textField: 'transcript',
  },
  de: { 
    displayName: 'German', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'german',
    split: 'test',
    textField: 'transcript',
  },
  es: { 
    displayName: 'Spanish', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'spanish',
    split: 'test',
    textField: 'transcript',
  },
  it: { 
    displayName: 'Italian', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'italian',
    split: 'test',
    textField: 'transcript',
  },
  pt: { 
    displayName: 'Portuguese', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'portuguese',
    split: 'test',
    textField: 'transcript',
  },
  nl: { 
    displayName: 'Dutch', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'dutch',
    split: 'test',
    textField: 'transcript',
  },
  pl: { 
    displayName: 'Polish', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'polish',
    split: 'test',
    textField: 'transcript',
  },
};

/**
 * Check if a language has test samples available.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {boolean}
 */
export function hasTestSamples(langCode) {
  return !!SPEECH_DATASETS[langCode?.toLowerCase()];
}

/**
 * Get dataset API URL for a language.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {{url: string, textField: string, dataset: string}|null}
 */
export function getDatasetUrl(langCode) {
  const config = SPEECH_DATASETS[langCode?.toLowerCase()];
  if (!config) return null;
  
  const url = `https://datasets-server.huggingface.co/first-rows?dataset=${config.dataset}&config=${config.config}&split=${config.split}`;
  
  return { 
    url, 
    textField: config.textField,
    dataset: config.dataset,
    displayName: config.displayName,
  };
}

/**
 * Fetch all available rows from a speech dataset.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {Promise<Array>} Array of row objects
 */
export async function fetchDatasetRows(langCode) {
  const datasetInfo = getDatasetUrl(langCode);
  if (!datasetInfo) {
    throw new Error(`No test dataset available for language: ${langCode}`);
  }

  const response = await fetch(datasetInfo.url);
  if (!response.ok) {
    throw new Error(`Dataset API error: ${response.status}`);
  }
  
  const data = await response.json();
  const rows = data.rows || [];
  
  if (rows.length === 0) {
    throw new Error('No data returned from dataset API');
  }

  return rows.map(r => ({
    ...r.row || r,
    _textField: datasetInfo.textField,
    _dataset: datasetInfo.dataset,
  }));
}

/**
 * Fetch a random speech sample from HuggingFace datasets.
 * 
 * @param {string} langCode - ISO 639-1 language code
 * @param {Object} [options]
 * @param {number} [options.targetSampleRate=16000] - Target sample rate for audio
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<{audioBuffer: ArrayBuffer, pcm: Float32Array, transcription: string, duration: number, sampleIndex: number, dataset: string}>}
 */
export async function fetchRandomSample(langCode, options = {}) {
  const { targetSampleRate = 16000, onProgress } = options;
  
  onProgress?.({ stage: 'fetching_metadata', message: 'Fetching dataset...' });
  
  const rows = await fetchDatasetRows(langCode);
  
  // Pick a random row
  const randomIndex = Math.floor(Math.random() * rows.length);
  const row = rows[randomIndex];

  // Get the audio URL and transcription
  const audio = row.audio;
  const audioUrl = Array.isArray(audio) ? audio[0]?.src : audio?.src;
  const transcription = row[row._textField] || '';
  
  if (!audioUrl) {
    throw new Error('No audio URL in dataset response');
  }

  onProgress?.({ stage: 'downloading_audio', message: 'Downloading audio...' });

  // Fetch the audio
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Audio download failed: ${audioRes.status}`);
  }
  
  const audioBuffer = await audioRes.arrayBuffer();

  onProgress?.({ stage: 'decoding_audio', message: 'Decoding audio...' });

  // Decode audio to PCM
  const audioCtx = new AudioContext({ sampleRate: targetSampleRate });
  const decoded = await audioCtx.decodeAudioData(audioBuffer.slice(0)); // slice to avoid detached buffer
  const pcm = decoded.getChannelData(0);
  const duration = pcm.length / targetSampleRate;
  await audioCtx.close();

  onProgress?.({ stage: 'complete', message: 'Ready' });

  return {
    audioBuffer,
    pcm,
    transcription,
    duration,
    sampleIndex: randomIndex,
    dataset: row._dataset,
    language: langCode,
  };
}

/**
 * Get list of languages with available test samples.
 * @returns {Array<{code: string, displayName: string}>}
 */
export function getAvailableLanguages() {
  return Object.entries(SPEECH_DATASETS).map(([code, config]) => ({
    code,
    displayName: config.displayName,
  }));
}
