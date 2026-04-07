import { performance } from 'node:perf_hooks';

// Setup data
const tLen = 4097;
const tokenLogits = new Float32Array(tLen);
for (let i = 0; i < tLen; i++) {
  tokenLogits[i] = Math.random() * 10;
}
const maxLogit = 9.9;
const invTemp = 1.0;
const len = tokenLogits.length;

// Current impl (local variable caching for multiplication before exp)
function softmaxLocalVars() {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0;
  let i = 0;
  for (; i <= len - 8; i += 8) {
    const v0 = (tokenLogits[i] - maxLogit) * invTemp;
    const v1 = (tokenLogits[i+1] - maxLogit) * invTemp;
    const v2 = (tokenLogits[i+2] - maxLogit) * invTemp;
    const v3 = (tokenLogits[i+3] - maxLogit) * invTemp;
    const v4 = (tokenLogits[i+4] - maxLogit) * invTemp;
    const v5 = (tokenLogits[i+5] - maxLogit) * invTemp;
    const v6 = (tokenLogits[i+6] - maxLogit) * invTemp;
    const v7 = (tokenLogits[i+7] - maxLogit) * invTemp;
    s0 += Math.exp(v0);
    s1 += Math.exp(v1);
    s2 += Math.exp(v2);
    s3 += Math.exp(v3);
    s4 += Math.exp(v4);
    s5 += Math.exp(v5);
    s6 += Math.exp(v6);
    s7 += Math.exp(v7);
  }
  let sumExp = s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7;
  for (; i < len; i++) {
    sumExp += Math.exp((tokenLogits[i] - maxLogit) * invTemp);
  }
  return sumExp;
}

// Direct memory access into Math.exp
function softmaxDirect() {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0;
  let i = 0;
  for (; i <= len - 8; i += 8) {
    s0 += Math.exp((tokenLogits[i] - maxLogit) * invTemp);
    s1 += Math.exp((tokenLogits[i+1] - maxLogit) * invTemp);
    s2 += Math.exp((tokenLogits[i+2] - maxLogit) * invTemp);
    s3 += Math.exp((tokenLogits[i+3] - maxLogit) * invTemp);
    s4 += Math.exp((tokenLogits[i+4] - maxLogit) * invTemp);
    s5 += Math.exp((tokenLogits[i+5] - maxLogit) * invTemp);
    s6 += Math.exp((tokenLogits[i+6] - maxLogit) * invTemp);
    s7 += Math.exp((tokenLogits[i+7] - maxLogit) * invTemp);
  }
  let sumExp = s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7;
  for (; i < len; i++) {
    sumExp += Math.exp((tokenLogits[i] - maxLogit) * invTemp);
  }
  return sumExp;
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
const res1 = measure('softmax local vars', softmaxLocalVars, iterations);
const res2 = measure('softmax direct access', softmaxDirect, iterations);

console.log(`${res1.name}: ${res1.avgMs.toFixed(2)} ms`);
console.log(`${res2.name}: ${res2.avgMs.toFixed(2)} ms`);
console.log(`Speedup (direct/local): ${(res1.avgMs / res2.avgMs).toFixed(2)}x`);
