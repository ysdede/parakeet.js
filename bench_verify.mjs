import SentenceBoundaryDetector from './src/sentence_boundary.js';

// We need to mock winkNLP since it's probably not easily loadable or we just want to test cache
global.winkNLP = () => ({
  readDoc: () => ({
    sentences: () => ({
      out: () => []
    })
  })
});

const detector = new SentenceBoundaryDetector();
detector.config.useNLP = true;

// Pre-populate cache
const words = [
  { text: "Hello" },
  { text: "world" },
  { text: "." }
];
detector.performNLP(words); // will cache

const iterations = 1000000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  detector.performNLP(words);
}

const end = performance.now();
console.log(`Time taken for ${iterations} cache hits (Optimized): ${(end - start).toFixed(2)} ms`);
