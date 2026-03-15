import { JsPreprocessor } from './src/mel.js';
import { performance } from 'perf_hooks';

const preprocessor = new JsPreprocessor({ nMels: 80 });

// generate some fake audio
const sampleRate = 16000;
const durationSecs = 30;
const audioLen = sampleRate * durationSecs;
const audio = new Float32Array(audioLen);
for (let i = 0; i < audioLen; i++) {
  audio[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
}

const nIter = 100;

console.log("Warming up...");
for (let i = 0; i < 10; i++) {
  preprocessor.process(audio);
}

console.log("Measuring...");
const start = performance.now();
for (let i = 0; i < nIter; i++) {
  preprocessor.process(audio);
}
const end = performance.now();

console.log(`Average time per process (30s audio): ${((end - start) / nIter).toFixed(2)}ms`);
