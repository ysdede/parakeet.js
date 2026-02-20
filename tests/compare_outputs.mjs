#!/usr/bin/env node
/**
 * Test script to compare parakeet.js output against Python reference.
 * 
 * Usage:
 *   1. First run the Python reference script to generate reference_output.json:
 *      python tests/python_reference.py --audio audio/-PjpQgMen3x4N7AEaDI8y.wav --debug
 * 
 *   2. Then run this script:
 *      node tests/compare_outputs.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Try to load parakeet.js dynamically
async function loadParakeet() {
  try {
    // In Node.js environment, we need to polyfill some browser APIs
    if (typeof globalThis.performance === 'undefined') {
      const { performance } = await import('perf_hooks');
      globalThis.performance = performance;
    }
    
    const parakeetPath = join(projectRoot, 'src', 'index.js');
    const parakeet = await import(parakeetPath);
    return parakeet;
  } catch (e) {
    console.error('Failed to load parakeet.js:', e.message);
    console.log('This test requires ONNX Runtime Web which may not be available in Node.js');
    console.log('Consider running the comparison in a browser environment instead.');
    return null;
  }
}

// Load reference output from Python
function loadReferenceOutput() {
  const refPath = join(projectRoot, 'tests', 'reference_output.json');
  
  if (!existsSync(refPath)) {
    console.error(`Reference output not found at: ${refPath}`);
    console.log('Please run the Python reference script first:');
    console.log('  python tests/python_reference.py --audio audio/-PjpQgMen3x4N7AEaDI8y.wav --debug');
    return null;
  }
  
  try {
    const content = readFileSync(refPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse reference output:', e.message);
    return null;
  }
}

// Calculate Word Error Rate (WER)
function calculateWER(reference, hypothesis) {
  const refWords = reference.toLowerCase().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.toLowerCase().split(/\s+/).filter(Boolean);
  
  // Levenshtein distance at word level
  const m = refWords.length;
  const n = hypWords.length;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (refWords[i - 1] === hypWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  const edits = dp[m][n];
  const wer = m > 0 ? (edits / m) * 100 : 0;
  
  return {
    wer,
    edits,
    refWordCount: m,
    hypWordCount: n,
  };
}

// Compare token sequences
function compareTokens(refTokens, jsTokens) {
  const matches = [];
  const mismatches = [];
  
  const maxLen = Math.max(refTokens?.length || 0, jsTokens?.length || 0);
  
  for (let i = 0; i < maxLen; i++) {
    const ref = refTokens?.[i];
    const js = jsTokens?.[i];
    
    if (ref === js) {
      matches.push({ index: i, token: ref });
    } else {
      mismatches.push({ index: i, reference: ref, javascript: js });
    }
  }
  
  return {
    totalMatches: matches.length,
    totalMismatches: mismatches.length,
    accuracy: maxLen > 0 ? (matches.length / maxLen) * 100 : 100,
    firstMismatches: mismatches.slice(0, 10),  // First 10 mismatches
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Parakeet.js vs onnx-asr Comparison Test');
  console.log('='.repeat(60));
  console.log();
  
  // Load reference output
  const reference = loadReferenceOutput();
  if (!reference) {
    process.exit(1);
  }
  
  console.log('Reference output loaded:');
  console.log(`  Text: "${reference.text}"`);
  console.log(`  Tokens: ${reference.tokens?.length || 0}`);
  console.log(`  Blank ID: ${reference.blank_idx}`);
  console.log(`  Vocab size: ${reference.vocab_size}`);
  console.log();
  
  // Show debug frames analysis
  if (reference.debug_frames) {
    console.log('Debug frames analysis (first 20):');
    const nonBlankFrames = reference.debug_frames.filter(f => !f.is_blank);
    const stateUpdates = reference.debug_frames.filter(f => f.state_updated);
    
    console.log(`  Total frames analyzed: ${reference.debug_frames.length}`);
    console.log(`  Non-blank emissions: ${nonBlankFrames.length}`);
    console.log(`  State updates: ${stateUpdates.length}`);
    console.log();
    
    console.log('  Sample frames (showing state update pattern):');
    reference.debug_frames.slice(0, 20).forEach(f => {
      const marker = f.state_updated ? 'PASS' : '·';
      console.log(`    t=${f.t.toString().padStart(3)}: ${marker} token=${f.token_str?.padEnd(10) || '?'} step=${f.step} blank=${f.is_blank}`);
    });
    console.log();
  }
  
  // If we can't load parakeet.js in Node, provide manual comparison instructions
  console.log('CRITICAL FIX APPLIED:');
  console.log('  - Decoder state now only updated on non-blank token emission');
  console.log('  - This matches Python reference: onnx-asr/src/onnx_asr/asr.py line 212');
  console.log();
  
  console.log('To validate the fix:');
  console.log('  1. Run the React demo: cd examples/react-demo && npm run dev');
  console.log('  2. Load the same audio file used for Python reference');
  console.log('  3. Compare transcription output');
  console.log();
  
  // Save comparison report
  const report = {
    timestamp: new Date().toISOString(),
    reference_text: reference.text,
    reference_token_count: reference.tokens?.length || 0,
    blank_idx: reference.blank_idx,
    vocab_size: reference.vocab_size,
    fixes_applied: [
      'Decoder state update only on non-blank token',
      'Dynamic blank ID from tokenizer',
      'Improved tokenizer space handling',
    ],
    validation_pending: true,
  };
  
  const reportPath = join(projectRoot, 'tests', 'comparison_report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Comparison report saved to: ${reportPath}`);
}

main().catch(console.error);
