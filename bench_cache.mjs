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

function runBaseline() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const { fullText, wordPositions } = detector.reconstructTextWithPositions(words);
    const cacheKey = detector.generateCacheKey(fullText);
    if (detector.cache.has(cacheKey)) {
      detector.mapSentenceEndingsToWords(detector.cache.get(cacheKey), words, wordPositions);
    }
  }
  return performance.now() - start;
}

function runOptimized() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const { fullText, wordPositions } = detector.reconstructTextWithPositions(words);
    const cacheKey = detector.generateCacheKey(fullText);
    const cached = detector.cache.get(cacheKey);
    if (cached !== undefined) {
      detector.mapSentenceEndingsToWords(cached, words, wordPositions);
    }
  }
  return performance.now() - start;
}

console.log(`Baseline: ${runBaseline().toFixed(2)} ms`);
console.log(`Optimized: ${runOptimized().toFixed(2)} ms`);
