import { performance } from 'node:perf_hooks';

function copyLoop(dst, src, frameStart, d) {
  for (let i = 0; i < d; i++) {
    dst[i] = src[frameStart + i];
  }
}

function copySetSubarray(dst, src, frameStart, d) {
  dst.set(src.subarray(frameStart, frameStart + d));
}

function parseIntArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  const value = Number.parseInt(process.argv[index + 1], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function measure(name, fn, cfg) {
  const { iterations, rounds, tEnc, d } = cfg;
  const src = new Float32Array(tEnc * d);
  for (let i = 0; i < src.length; i++) {
    src[i] = i % 17;
  }
  const dst = new Float32Array(d);

  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < iterations; k++) {
      fn(dst, src, (k % tEnc) * d, d);
    }
  }

  const samples = [];
  let checksum = 0;
  for (let r = 0; r < rounds; r++) {
    const start = performance.now();
    for (let k = 0; k < iterations; k++) {
      fn(dst, src, (k % tEnc) * d, d);
    }
    const end = performance.now();
    samples.push(end - start);
    checksum += dst[r % d];
  }

  const avgMs = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { name, avgMs, minMs: Math.min(...samples), maxMs: Math.max(...samples), checksum };
}

function main() {
  const cfg = {
    d: parseIntArg('--d', 640),
    tEnc: parseIntArg('--tenc', 512),
    iterations: parseIntArg('--iterations', 200000),
    rounds: parseIntArg('--rounds', 5),
  };

  const loopRes = measure('manual_loop', copyLoop, cfg);
  const setRes = measure('set_subarray', copySetSubarray, cfg);
  const speedup = loopRes.avgMs / setRes.avgMs;

  console.log('Frame copy benchmark (manual loop vs set+subarray)');
  console.log(`Config: D=${cfg.d}, Tenc=${cfg.tEnc}, iterations=${cfg.iterations}, rounds=${cfg.rounds}`);
  console.log(`${loopRes.name}: avg=${loopRes.avgMs.toFixed(3)} ms (min=${loopRes.minMs.toFixed(3)}, max=${loopRes.maxMs.toFixed(3)})`);
  console.log(`${setRes.name}: avg=${setRes.avgMs.toFixed(3)} ms (min=${setRes.minMs.toFixed(3)}, max=${setRes.maxMs.toFixed(3)})`);
  console.log(`Speedup (manual / set): ${speedup.toFixed(2)}x`);
  console.log(`Checksums: loop=${loopRes.checksum.toFixed(1)}, set=${setRes.checksum.toFixed(1)}`);
}

main();
