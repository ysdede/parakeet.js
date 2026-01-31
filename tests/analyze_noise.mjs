import { readFileSync } from 'fs';

const ref = JSON.parse(readFileSync('./tests/reference_output.json', 'utf-8'));
const tokens = ref.token_strings;
const timestamps = ref.timestamps;
const tokenIds = ref.tokens;

console.log('Looking for noise/cancellation sequence:\n');

// Find the sequence around "Canvid's noise cancellation"
const apostropheIdx = tokens.findIndex(t => t === "'");
if (apostropheIdx > 0) {
  console.log('Sequence around "Canvid\'s noise cancellation":');
  console.log('='.repeat(60));
  for (let i = apostropheIdx - 5; i < apostropheIdx + 20 && i < tokens.length; i++) {
    const marker = tokens[i].includes('no') || tokens[i].includes('ise') ? '<<<' : '';
    console.log(`  [${i.toString().padStart(3)}] t=${timestamps[i].toString().padStart(3)} id=${tokenIds[i].toString().padStart(4)} token='${tokens[i]}' ${marker}`);
  }
}

// Find ALL noise-related tokens
console.log('\n\nAll tokens containing "no" or "oise":');
console.log('='.repeat(60));
for (let i = 0; i < tokens.length; i++) {
  if (tokens[i].toLowerCase().includes('no') || tokens[i].toLowerCase().includes('oise')) {
    console.log(`  [${i.toString().padStart(3)}] t=${timestamps[i].toString().padStart(3)} id=${tokenIds[i].toString().padStart(4)} token='${tokens[i]}'`);
  }
}

// Show debug frames around the noise area (frame ~250)
console.log('\n\nDebug frames around t=250 (noise area):');
console.log('='.repeat(60));
const debugFrames = ref.debug_frames || [];
for (const frame of debugFrames) {
  if (frame.t >= 240 && frame.t <= 270) {
    const marker = frame.state_updated ? '✓' : '·';
    console.log(`  t=${frame.t.toString().padStart(3)}: ${marker} token='${frame.token_str?.padEnd(10)}' step=${frame.step} blank=${frame.is_blank}`);
  }
}
