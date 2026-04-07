import { performance } from 'node:perf_hooks';

// Simulate typical token logit length (e.g. vocab size = 4096)
const vocabSize = 4096;
const tokenLogits = new Float32Array(vocabSize);
for (let i = 0; i < vocabSize; i++) {
  tokenLogits[i] = Math.random() * 10;
}

const maxLogit = 9.9;
const invTemp = 1.0;

function softmaxSimple() {
  let sumExp = 0;
  for (let i = 0; i < vocabSize; i++) {
    sumExp += Math.exp((tokenLogits[i] - maxLogit) * invTemp);
  }
  return sumExp;
}

function softmax8x() {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0;
  let i = 0;
  for (; i <= vocabSize - 8; i += 8) {
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
  for (; i < vocabSize; i++) {
    sumExp += Math.exp((tokenLogits[i] - maxLogit) * invTemp);
  }
  return sumExp;
}

function softmaxFast() {
    // try direct Math.exp accumulation but avoiding the cached v0..v7
    let sumExp = 0;
    for (let i = 0; i < vocabSize; i++) {
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

const iterations = 10000;
const res1 = measure('softmax simple', softmaxSimple, iterations);
const res2 = measure('softmax 8x', softmax8x, iterations);
const res3 = measure('softmax fast', softmaxFast, iterations);

console.log(`${res1.name}: ${res1.avgMs.toFixed(2)} ms`);
console.log(`${res2.name}: ${res2.avgMs.toFixed(2)} ms`);
console.log(`${res3.name}: ${res3.avgMs.toFixed(2)} ms`);
