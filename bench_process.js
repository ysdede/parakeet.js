import { JsPreprocessor } from './src/mel.js';
import { performance } from 'perf_hooks';

const preprocessor = new JsPreprocessor({ nMels: 80 });

// generate some fake audio
const sampleRate = 16000;
const durationSecs = 10;
const audioLen = sampleRate * durationSecs;
const audio = new Float32Array(audioLen);
for (let i = 0; i < audioLen; i++) {
  audio[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
}

const nIter = 100;

console.log("Warming up...");
let sum = 0;
for (let i = 0; i < 10; i++) {
  const { features } = preprocessor.process(audio);
  sum += features[0];
}

console.log("Measuring process()...");
const start = performance.now();
for (let i = 0; i < nIter; i++) {
  const { features } = preprocessor.process(audio);
  sum += features[0]; // prevent dead code elimination
}
const end = performance.now();

console.log(`Average time per process: ${((end - start) / nIter).toFixed(2)}ms`);

console.log("Measuring normalizeFeatures()...");
const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
const start2 = performance.now();
for (let i = 0; i < nIter; i++) {
  const f = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);
  sum += f[0];
}
const end2 = performance.now();

console.log(`Average time per normalizeFeatures: ${((end2 - start2) / nIter).toFixed(2)}ms`);
console.log(sum);
