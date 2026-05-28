import { performance } from 'perf_hooks';

// Create a mock vocab with a bunch of tokens
const vocabLines = [];
for (let i = 0; i < 50000; i++) {
  vocabLines.push(`tok${i} ${i}`);
}
const text = vocabLines.join('\n');

const iterations = 50;

function runBaseline() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const id2token = [];
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      const [tok, idStr] = line.split(/\s+/);
      const id = parseInt(idStr, 10);
      if (isNaN(id) || !tok) {
        continue;
      }
      id2token[id] = tok;
    }
  }
  const end = performance.now();
  return end - start;
}

function runOptimized() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const id2token = [];
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      let spaceIdx = line.lastIndexOf(' ');
      const tabIdx = line.lastIndexOf('\t');
      if (tabIdx > spaceIdx) spaceIdx = tabIdx;

      if (spaceIdx === -1) {
        continue;
      }

      const tok = line.slice(0, spaceIdx);
      const idStr = line.slice(spaceIdx + 1);

      const id = parseInt(idStr, 10);
      if (isNaN(id) || !tok) {
        continue;
      }
      id2token[id] = tok;
    }
  }
  const end = performance.now();
  return end - start;
}

const baselineTime = runBaseline();
const optimizedTime = runOptimized();

console.log(`Baseline (split(/\\s+/)): ${baselineTime.toFixed(2)}ms`);
console.log(`Optimized (lastIndexOf space/tab): ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}% faster`);
