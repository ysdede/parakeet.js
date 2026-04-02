import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const hardwareConcurrency = typeof os.availableParallelism === 'function'
  ? os.availableParallelism()
  : os.cpus().length;

if (!globalThis.navigator) {
  globalThis.navigator = {};
}
if (!Number.isFinite(globalThis.navigator.hardwareConcurrency)) {
  globalThis.navigator.hardwareConcurrency = hardwareConcurrency;
}

const { ParakeetModel } = await import('../src/parakeet.js');
const { MODELS } = await import('../src/models.js');
const { splitTextIntoSentences } = await import('../src/sentence_boundary.js');

function getArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(4) : 'n/a';
}

function decodeAudioToFloat32(audioPath, sampleRate = 16000) {
  const stdout = execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', audioPath,
    '-ac', '1',
    '-ar', String(sampleRate),
    '-f', 'f32le',
    'pipe:1',
  ], { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });

  return new Float32Array(stdout.buffer.slice(stdout.byteOffset, stdout.byteOffset + stdout.byteLength));
}

async function downloadBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function downloadTextAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return `data:text/plain;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

async function loadModel(modelKey, wasmPaths) {
  const modelRepoId = MODELS[modelKey]?.repoId || modelKey;
  const modelBaseUrl = `https://huggingface.co/${modelRepoId}/resolve/main`;
  const [encoderBytes, decoderBytes, tokenizerDataUrl] = await Promise.all([
    downloadBytes(`${modelBaseUrl}/encoder-model.int8.onnx`),
    downloadBytes(`${modelBaseUrl}/decoder_joint-model.int8.onnx`),
    downloadTextAsDataUrl(`${modelBaseUrl}/vocab.txt`),
  ]);

  return ParakeetModel.fromUrls({
    encoderUrl: encoderBytes,
    decoderUrl: decoderBytes,
    tokenizerUrl: tokenizerDataUrl,
    backend: 'wasm',
    preprocessorBackend: 'js',
    wasmPaths,
  });
}

function runJiwer(reference, hypothesis) {
  const payload = JSON.stringify({ reference, hypothesis });
  const pythonScript = [
    'import json, sys',
    'from jiwer import wer, cer',
    'payload = json.load(sys.stdin)',
    'print(json.dumps({',
    "  'wer': wer(payload['reference'], payload['hypothesis']),",
    "  'cer': cer(payload['reference'], payload['hypothesis'])",
    '}))',
  ].join('\n');

  const result = spawnSync('python', ['-c', pythonScript], {
    input: payload,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'jiwer comparison failed');
  }

  return JSON.parse(result.stdout.trim());
}

const audioPath = getArg('--audio', 'R:\\Downloads\\yearwiththebirds_2202_librivox\\end-of-chapter-4.mp3');
const truthPath = getArg('--truth', audioPath.replace(/\.[^.]+$/, '.txt'));
const modelKey = getArg('--model', 'parakeet-tdt-0.6b-v3');
const chunkLengthRaw = getArg('--chunk-length', '0');
const chunkLengthS = Number(chunkLengthRaw || 0);

if (!fs.existsSync(audioPath)) {
  throw new Error(`Audio file not found: ${audioPath}`);
}
if (!fs.existsSync(truthPath)) {
  throw new Error(`Ground-truth file not found: ${truthPath}`);
}

const wasmDistPath = pathToFileURL(`${path.resolve('node_modules/onnxruntime-web/dist')}${path.sep}`).href;
const audio = decodeAudioToFloat32(audioPath, 16000);
const groundTruthText = fs.readFileSync(truthPath, 'utf8').trim();
const model = await loadModel(modelKey, wasmDistPath);
const result = await model.transcribeLongAudio(audio, 16000, {
  chunkLengthS,
  returnTimestamps: true,
  language: 'en',
});

const referenceSentences = splitTextIntoSentences(groundTruthText);
const hypothesisSentences = splitTextIntoSentences(result.text);
const referenceForJiwer = referenceSentences.join('\n');
const hypothesisForJiwer = hypothesisSentences.join('\n');
const scores = runJiwer(referenceForJiwer, hypothesisForJiwer);

console.log(`audio: ${audioPath}`);
console.log(`truth: ${truthPath}`);
console.log(`model: ${modelKey}`);
console.log(`duration_s: ${(audio.length / 16000).toFixed(2)}`);
console.log(`chunk_length_s: ${chunkLengthS || 'auto'}`);
console.log(`ref_sentences: ${referenceSentences.length}`);
console.log(`hyp_sentences: ${hypothesisSentences.length}`);
console.log(`wer: ${formatScore(scores.wer)}`);
console.log(`cer: ${formatScore(scores.cer)}`);

console.log('\n[reference sentences]');
referenceSentences.forEach((sentence, index) => {
  console.log(`${index + 1}. ${sentence}`);
});

console.log('\n[hypothesis sentences]');
hypothesisSentences.forEach((sentence, index) => {
  console.log(`${index + 1}. ${sentence}`);
});

console.log('\n[hypothesis text]');
console.log(result.text);
