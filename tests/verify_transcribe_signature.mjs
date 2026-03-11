import { ParakeetModel } from '../src/parakeet.js';

async function test() {
  console.log('Successfully imported ParakeetModel');
  const proto = ParakeetModel.prototype;
  console.log('Checking transcribe method...');
  if (typeof proto.transcribe !== 'function') {
    throw new Error('transcribe is not a function');
  }

  // We can't easily execute it fully without all mocks, but we can check if it exists.
  console.log('transcribe method found.');

  // To really verify destructuring, we can use a small trick:
  // Get the source code of the function and check if skipCMVN is present.
  const source = proto.transcribe.toString();
  if (source.includes('skipCMVN')) {
    throw new Error('transcribe source still contains skipCMVN');
  }
  console.log('Verified: skipCMVN is not in transcribe source.');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
