#!/usr/bin/env node
/**
 * Analyze parakeet benchmark JSON: timing breakdown, scaling vs audio duration, bottleneck.
 * Usage: node metrics/analyze-benchmark.js metrics/parakeet-benchmark-1772221557947.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || path.join(__dirname, 'parakeet-benchmark-1772221557947.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

const runs = data.runs || [];
if (!runs.length) {
  console.error('No runs in JSON');
  process.exit(1);
}

// Extract series
const durationSec = runs.map(r => r.audioDurationSec);
const preprocess = runs.map(r => r.metrics?.preprocess_ms ?? 0);
const encode = runs.map(r => r.metrics?.encode_ms ?? 0);
const decode = runs.map(r => r.metrics?.decode_ms ?? 0);
const total = runs.map(r => r.metrics?.total_ms ?? 0);
const rtf = runs.map(r => r.metrics?.rtf ?? 0);
const tokenize = runs.map(r => r.metrics?.tokenize_ms ?? 0);

function sum(a) { return a.reduce((s, x) => s + x, 0); }
function mean(a) { return sum(a) / a.length; }
function min(a) { return Math.min(...a); }
function max(a) { return Math.max(...a); }
function std(a) {
  const m = mean(a);
  const v = sum(a.map(x => (x - m) ** 2)) / a.length;
  return Math.sqrt(v);
}
function p50(a) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length * 0.5)];
}
function p95(a) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length * 0.95)];
}

// Linear regression: y ≈ a*x + b, return { a, b, r2 }
function linearFit(x, y) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const a = den === 0 ? 0 : num / den;
  const b = my - a * mx;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = a * x[i] + b;
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a, b, r2 };
}

console.log('=== Parakeet benchmark analysis ===\n');
const totalMean = mean(total);
const fmt = (n, d = 1) => Number(n).toFixed(d);

console.log('Config:', data.settings?.modelKey, data.settings?.backend, data.settings?.decoderQuant);
console.log('Samples:', runs.length);
console.log(`Audio duration: ${fmt(min(durationSec), 2)}–${fmt(max(durationSec), 2)} s (mean ${fmt(mean(durationSec), 2)} s)\n`);

console.log('--- 1. Phase time (ms) ---');
const phases = [
  ['Preprocess', preprocess],
  ['Encode (WebGPU)', encode],
  ['Decode (WASM)', decode],
  ['Tokenize', tokenize],
  ['Total', total],
];
for (const [name, arr] of phases) {
  console.log(
    `${name.padEnd(18)}: mean ${fmt(mean(arr))}  min ${fmt(min(arr))}  max ${fmt(max(arr))}  p50 ${fmt(p50(arr))}  p95 ${fmt(p95(arr))}  std ${fmt(std(arr))}`
  );
}

console.log('\n--- 2. Share of total time ---');
for (const [name, arr] of [['Preprocess', preprocess], ['Encode', encode], ['Decode', decode], ['Tokenize', tokenize]]) {
  const pct = (100 * mean(arr)) / totalMean;
  console.log(`${name.padEnd(12)}: ${fmt(pct)}%`);
}

console.log('\n--- 3. Scaling vs audio duration (linear fit: time_ms = a * duration_sec + b) ---');
for (const [name, arr] of [['Preprocess', preprocess], ['Encode', encode], ['Decode', decode], ['Total', total]]) {
  const { a, b, r2 } = linearFit(durationSec, arr);
  console.log(`${name.padEnd(12)}: ${fmt(a, 2)} * duration_sec + ${fmt(b)}   R² = ${fmt(r2, 3)}`);
}

console.log('\n--- 4. RTF (real-time factor; higher = faster than realtime) ---');
console.log(`RTF: mean ${fmt(mean(rtf), 2)}  min ${fmt(min(rtf), 2)}  max ${fmt(max(rtf), 2)}  p50 ${fmt(p50(rtf), 2)}  std ${fmt(std(rtf), 2)}`);
const fitRtf = linearFit(durationSec, rtf);
console.log(`RTF vs duration: slope ${fmt(fitRtf.a, 4)} (R² = ${fmt(fitRtf.r2, 3)}) — negative slope = longer clips get lower RTF`);

console.log('\n--- 5. Decode variance (same duration bucket, different decode time) ---');
const buckets = {};
durationSec.forEach((d, i) => {
  const b = Math.floor(d / 2) * 2;
  if (!buckets[b]) buckets[b] = [];
  buckets[b].push({ d, decode: decode[i], encode: encode[i] });
});
console.log('Duration bucket (s)  count  decode_ms (min–max)   encode_ms (min–max)');
for (const b of Object.keys(buckets).map(Number).sort((a, b) => a - b)) {
  const arr = buckets[b];
  const dec = arr.map(x => x.decode);
  const enc = arr.map(x => x.encode);
  console.log(`${b}-${b + 2}`.padEnd(20) + String(arr.length).padEnd(7) + `${min(dec)}-${max(dec)}`.padEnd(20) + `${min(enc)}-${max(enc)}`);
}

console.log('\n--- 6. Bottleneck summary ---');
const prePct = (100 * mean(preprocess)) / totalMean;
const encPct = (100 * mean(encode)) / totalMean;
const decPct = (100 * mean(decode)) / totalMean;
const dominant = [['Preprocess', prePct], ['Encode', encPct], ['Decode', decPct]].sort((a, b) => b[1] - a[1]);
console.log(`Largest share: ${dominant[0][0]} (${fmt(dominant[0][1])}%), then ${dominant[1][0]} (${fmt(dominant[1][1])}%), then ${dominant[2][0]} (${fmt(dominant[2][1])}%)`);
const decFit = linearFit(durationSec, decode);
const encFit = linearFit(durationSec, encode);
console.log(`Decode: ${fmt(decFit.a, 2)} ms per second of audio (R² = ${fmt(decFit.r2, 3)})`);
console.log(`Encode: ${fmt(encFit.a, 2)} ms per second of audio (R² = ${fmt(encFit.r2, 3)})`);
if (decFit.r2 < 0.85) {
  console.log('Decode R² < 0.85 → time is not purely linear in audio length; influenced by output length (tokens) or variance.');
}
