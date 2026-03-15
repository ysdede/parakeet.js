let currentSuite = '';
let passed = 0;
let failed = 0;

export function describe(name, fn) {
  currentSuite = name;
  fn();
}

export function beforeAll(fn) {
  fn();
}

export function it(name, fn) {
  try {
    fn();
    console.log(`✅ [${currentSuite}] ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ [${currentSuite}] ${name}`);
    console.error(e);
    failed++;
  }
}

export function expect(actual) {
  return {
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      if (diff > Math.pow(10, -precision) / 2) {
        throw new Error(`Expected ${expected} (precision ${precision}), but got ${actual}`);
      }
    },
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (!(actual > expected)) {
        throw new Error(`Expected > ${expected}, but got ${actual}`);
      }
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual.length}`);
      }
    }
  };
}
