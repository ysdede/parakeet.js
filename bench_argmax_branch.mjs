import { performance } from 'node:perf_hooks';

// Setup data
const tLen = 4097;
const tokenLogits = new Float32Array(tLen);
for (let i = 0; i < tLen; i++) {
  tokenLogits[i] = Math.random() * 10;
}

function argmaxBranch() {
  let maxLogit = -Infinity, maxId = 0;
  let i = 0;
  for (; i <= tLen - 8; i += 8) {
    if (tokenLogits[i] > maxLogit) { maxLogit = tokenLogits[i]; maxId = i; }
    if (tokenLogits[i+1] > maxLogit) { maxLogit = tokenLogits[i+1]; maxId = i + 1; }
    if (tokenLogits[i+2] > maxLogit) { maxLogit = tokenLogits[i+2]; maxId = i + 2; }
    if (tokenLogits[i+3] > maxLogit) { maxLogit = tokenLogits[i+3]; maxId = i + 3; }
    if (tokenLogits[i+4] > maxLogit) { maxLogit = tokenLogits[i+4]; maxId = i + 4; }
    if (tokenLogits[i+5] > maxLogit) { maxLogit = tokenLogits[i+5]; maxId = i + 5; }
    if (tokenLogits[i+6] > maxLogit) { maxLogit = tokenLogits[i+6]; maxId = i + 6; }
    if (tokenLogits[i+7] > maxLogit) { maxLogit = tokenLogits[i+7]; maxId = i + 7; }
  }
  for (; i < tLen; i++) {
    if (tokenLogits[i] > maxLogit) { maxLogit = tokenLogits[i]; maxId = i; }
  }
  return { maxLogit, maxId };
}

function measure(name, fn, iterations) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  return { name, avgMs: end - start };
}

const iterations = 50000;
const res1 = measure('argmax branch (direct access)', argmaxBranch, iterations);
console.log(`${res1.name}: ${res1.avgMs.toFixed(2)} ms`);
