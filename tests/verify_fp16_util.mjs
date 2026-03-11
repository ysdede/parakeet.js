import { usesRequestedFp16 } from '../src/index.js';

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message} - Expected ${expected}, got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

function main() {
  console.log('Running standalone verification for usesRequestedFp16...');

  try {
    assertEquals(usesRequestedFp16({ encoderQuant: 'fp16' }), true, 'encoderQuant: "fp16"');
    assertEquals(usesRequestedFp16({ decoderQuant: 'fp16' }), true, 'decoderQuant: "fp16"');
    assertEquals(usesRequestedFp16({ encoderQuant: 'fp16', decoderQuant: 'fp16' }), true, 'Both "fp16"');
    assertEquals(usesRequestedFp16({ encoderQuant: 'fp32', decoderQuant: 'int8' }), false, 'Neither "fp16"');
    assertEquals(usesRequestedFp16({}), false, 'Empty options');
    assertEquals(usesRequestedFp16(null), false, 'null options');
    assertEquals(usesRequestedFp16(undefined), false, 'undefined options');
    assertEquals(usesRequestedFp16(), false, 'no arguments');

    console.log('\nALL STANDALONE TESTS PASSED');
  } catch (error) {
    console.error('\n' + error.message);
    process.exit(1);
  }
}

main();
