import { performance } from 'node:perf_hooks';

const nFreqBins = 257; // N_FFT/2 + 1
const twHalf = { cos: new Float64Array(128), sin: new Float64Array(128) };
const re = new Float64Array(128);
const im = new Float64Array(128);

for(let i=0; i<128; i++) {
    twHalf.cos[i] = Math.random();
    twHalf.sin[i] = Math.random();
    re[i] = Math.random();
    im[i] = Math.random();
}

function processDirect(powerBuf) {
    const halfN = 256;
    const quarterN = 128;
    const fftRe = re;
    const fftIm = im;
    const r0 = fftRe[0];
    const i0 = fftIm[0];
    powerBuf[0] = (r0 + i0) * (r0 + i0);
    powerBuf[halfN] = (r0 - i0) * (r0 - i0);
    const twFull = { cos: new Float64Array(256), sin: new Float64Array(256) };

    for (let k = 1; k < quarterN; k++) {
        const n_k = quarterN - k;

        const rk = fftRe[k];
        const ik = fftIm[k];
        const rnk = fftRe[n_k];
        const ink = fftIm[n_k];

        const xeR = 0.5 * (rk + rnk);
        const xeI = 0.5 * (ik - ink);
        const xoR = 0.5 * (ik + ink);
        const xoI = -0.5 * (rk - rnk);

        const wc = twFull.cos[k];
        const ws = twFull.sin[k];
        const tr = xoR * wc - xoI * ws;
        const ti = xoR * ws + xoI * wc;

        const xkR = xeR + tr;
        const xkI = xeI + ti;
        powerBuf[k] = xkR * xkR + xkI * xkI;

        const xnkR = xeR - tr;
        const xnkI = xeI - ti;
        powerBuf[halfN - k] = xnkR * xnkR + xnkI * xnkI;
    }
}

function processLocalVars(powerBuf) {
    const halfN = 256;
    const quarterN = 128;
    const fftRe = re;
    const fftIm = im;
    const r0 = fftRe[0];
    const i0 = fftIm[0];
    powerBuf[0] = (r0 + i0) * (r0 + i0);
    powerBuf[halfN] = (r0 - i0) * (r0 - i0);
    const twFull = { cos: new Float64Array(256), sin: new Float64Array(256) };

    // just to measure
    for (let k = 1; k < quarterN; k++) {
        const n_k = quarterN - k;

        const rk = fftRe[k];
        const ik = fftIm[k];
        const rnk = fftRe[n_k];
        const ink = fftIm[n_k];

        const xeR = 0.5 * (rk + rnk);
        const xeI = 0.5 * (ik - ink);
        const xoR = 0.5 * (ik + ink);
        const xoI = -0.5 * (rk - rnk);

        const wc = twFull.cos[k];
        const ws = twFull.sin[k];
        const tr = xoR * wc - xoI * ws;
        const ti = xoR * ws + xoI * wc;

        const xkR = xeR + tr;
        const xkI = xeI + ti;
        powerBuf[k] = xkR * xkR + xkI * xkI;

        const xnkR = xeR - tr;
        const xnkI = xeI - ti;
        powerBuf[halfN - k] = xnkR * xnkR + xnkI * xnkI;
    }
}
// Actually, this logic is already pretty optimized math.

function measure(name, fn, iterations) {
  const pbuf = new Float32Array(nFreqBins);
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn(pbuf);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(pbuf);
  }
  const end = performance.now();

  return { name, avgMs: end - start };
}

const iterations = 50000;
const res1 = measure('process direct', processDirect, iterations);
const res2 = measure('process local vars', processLocalVars, iterations);

console.log(`${res1.name}: ${res1.avgMs.toFixed(2)} ms`);
