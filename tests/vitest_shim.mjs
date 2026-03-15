export function describe(name, fn) {
  console.log('Running test suite:', name);
  fn();
}

export function it(name, fn) {
  try {
    fn();
    console.log('  PASS:', name);
  } catch (e) {
    console.error('  FAIL:', name);
    console.error(e);
    process.exitCode = 1;
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null but got ${actual}`);
      }
    }
  };
}
