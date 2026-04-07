import { performance } from 'node:perf_hooks';

// Setup data
const tLen = 4097;
const tokenLogits = new Float32Array(tLen);
for (let i = 0; i < tLen; i++) {
  tokenLogits[i] = Math.random() * 10;
}

// Current impl (local variables v0-v7)
function argmaxLocalVars() {
  let maxLogit = -Infinity, maxId = 0;
  let i = 0;
  for (; i < tLen % 8; i++) {
    if (tokenLogits[i] > maxLogit) { maxLogit = tokenLogits[i]; maxId = i; }
  }
  for (; i < tLen; i += 8) {
    const v0 = tokenLogits[i];
    const v1 = tokenLogits[i+1];
    const v2 = tokenLogits[i+2];
    const v3 = tokenLogits[i+3];
    const v4 = tokenLogits[i+4];
    const v5 = tokenLogits[i+5];
    const v6 = tokenLogits[i+6];
    const v7 = tokenLogits[i+7];
    if (v0 > maxLogit) { maxLogit = v0; maxId = i; }
    if (v1 > maxLogit) { maxLogit = v1; maxId = i + 1; }
    if (v2 > maxLogit) { maxLogit = v2; maxId = i + 2; }
    if (v3 > maxLogit) { maxLogit = v3; maxId = i + 3; }
    if (v4 > maxLogit) { maxLogit = v4; maxId = i + 4; }
    if (v5 > maxLogit) { maxLogit = v5; maxId = i + 5; }
    if (v6 > maxLogit) { maxLogit = v6; maxId = i + 6; }
    if (v7 > maxLogit) { maxLogit = v7; maxId = i + 7; }
  }
  return { maxLogit, maxId };
}

// Direct memory access impl
function argmaxDirect() {
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
const res1 = measure('argmax local vars', argmaxLocalVars, iterations);
const res2 = measure('argmax direct access', argmaxDirect, iterations);

console.log(`${res1.name}: ${res1.avgMs.toFixed(2)} ms`);
console.log(`${res2.name}: ${res2.avgMs.toFixed(2)} ms`);
console.log(`Speedup (direct/local): ${(res1.avgMs / res2.avgMs).toFixed(2)}x`);
