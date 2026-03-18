const { performance } = require('perf_hooks');

function benchTranspose2() {
  const B = 1, D = 640, Tenc = 1500;
  const encData = new Float32Array(D * Tenc);
  for (let i = 0; i < encData.length; i++) encData[i] = Math.random();

  let transposed2 = new Float32Array(Tenc * D);
  let transposed3 = new Float32Array(Tenc * D);

  function transposeUnrolled() {
    // 8x unrolled sequential memory write loop (outer loop t, inner loop d)
    for (let t = 0; t < Tenc; t++) {
      const tOffset = t * D;
      let d = 0;
      for (; d <= D - 8; d += 8) {
        const encOffset = d * Tenc + t;
        transposed2[tOffset + d] = encData[encOffset];
        transposed2[tOffset + d + 1] = encData[encOffset + Tenc];
        transposed2[tOffset + d + 2] = encData[encOffset + 2 * Tenc];
        transposed2[tOffset + d + 3] = encData[encOffset + 3 * Tenc];
        transposed2[tOffset + d + 4] = encData[encOffset + 4 * Tenc];
        transposed2[tOffset + d + 5] = encData[encOffset + 5 * Tenc];
        transposed2[tOffset + d + 6] = encData[encOffset + 6 * Tenc];
        transposed2[tOffset + d + 7] = encData[encOffset + 7 * Tenc];
      }
      for (; d < D; d++) {
        transposed2[tOffset + d] = encData[d * Tenc + t];
      }
    }
  }

  function transposeBlocked() {
    const blockSize = Math.min(64, D); // Tune block size for cache efficiency

    for (let dBlock = 0; dBlock < D; dBlock += blockSize) {
      const dEnd = Math.min(dBlock + blockSize, D);
      for (let t = 0; t < Tenc; t++) {
        const tOffset = t * D;
        for (let d = dBlock; d < dEnd; d++) {
          transposed3[tOffset + d] = encData[d * Tenc + t];
        }
      }
    }
  }

  function transposeUnrolledV2() {
    // 8x unrolled sequential memory write loop (outer loop t, inner loop d)
    for (let t = 0; t < Tenc; t++) {
      const tOffset = t * D;
      let d = 0;
      for (; d <= D - 8; d += 8) {
        const encOffset = d * Tenc + t;
        transposed3[tOffset + d] = encData[encOffset];
        transposed3[tOffset + d + 1] = encData[encOffset + Tenc];
        transposed3[tOffset + d + 2] = encData[encOffset + 2 * Tenc];
        transposed3[tOffset + d + 3] = encData[encOffset + 3 * Tenc];
        transposed3[tOffset + d + 4] = encData[encOffset + 4 * Tenc];
        transposed3[tOffset + d + 5] = encData[encOffset + 5 * Tenc];
        transposed3[tOffset + d + 6] = encData[encOffset + 6 * Tenc];
        transposed3[tOffset + d + 7] = encData[encOffset + 7 * Tenc];
      }
      for (; d < D; d++) {
        transposed3[tOffset + d] = encData[d * Tenc + t];
      }
    }
  }

  // Warmup
  for (let i = 0; i < 100; i++) {
    transposeUnrolled();
    transposeUnrolledV2();
  }

  const iters = 1000;
  let t2 = performance.now();
  for (let i = 0; i < iters; i++) transposeUnrolled();
  let t3 = performance.now();
  console.log(`Unrolled: ${(t3 - t2).toFixed(2)} ms`);

  let t4 = performance.now();
  for (let i = 0; i < iters; i++) transposeUnrolledV2();
  let t5 = performance.now();
  console.log(`UnrolledV2: ${(t5 - t4).toFixed(2)} ms`);

  // Verify correctness
  let correct = true;
  for (let i = 0; i < transposed3.length; i++) {
    if (transposed3[i] !== transposed2[i]) {
      correct = false;
      break;
    }
  }
  console.log(`Correct: ${correct}`);
}

benchTranspose2();
