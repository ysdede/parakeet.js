function copyWithLoop(dst, src, frameStart, d) {
  for (let i = 0; i < d; i++) {
    dst[i] = src[frameStart + i];
  }
}

function copyWithSetSubarray(dst, src, frameStart, d) {
  dst.set(src.subarray(frameStart, frameStart + d));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildTransposed(tEnc, d, random) {
  const out = new Float32Array(tEnc * d);
  for (let i = 0; i < out.length; i++) {
    out[i] = (random() * 2) - 1;
  }
  return out;
}

function verifyCase(tEnc, d, seed) {
  const random = seededRandom(seed);
  const transposed = buildTransposed(tEnc, d, random);
  const viaLoop = new Float32Array(d);
  const viaSet = new Float32Array(d);

  for (let t = 0; t < tEnc; t++) {
    const frameStart = t * d;
    copyWithLoop(viaLoop, transposed, frameStart, d);
    copyWithSetSubarray(viaSet, transposed, frameStart, d);
    for (let i = 0; i < d; i++) {
      if (viaLoop[i] !== viaSet[i]) {
        throw new Error(
          `Mismatch: seed=${seed}, Tenc=${tEnc}, D=${d}, frame=${t}, i=${i}, loop=${viaLoop[i]}, set=${viaSet[i]}`
        );
      }
    }
  }
}

function main() {
  const cases = [
    { tEnc: 1, d: 1, seed: 1 },
    { tEnc: 3, d: 4, seed: 2 },
    { tEnc: 8, d: 16, seed: 3 },
    { tEnc: 64, d: 128, seed: 4 },
    { tEnc: 96, d: 640, seed: 5 },
    { tEnc: 257, d: 640, seed: 6 },
  ];

  for (const c of cases) {
    verifyCase(c.tEnc, c.d, c.seed);
  }

  console.log(`PASS verify_copy (${cases.length} cases)`);
}

main();
