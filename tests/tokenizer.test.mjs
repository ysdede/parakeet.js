import { describe, expect, it } from 'vitest';
import { ParakeetTokenizer } from '../src/tokenizer.js';

/**
 * Build a minimal tokenizer with known ▁-prefixed tokens.
 */
function buildTokenizer(tokens) {
  return new ParakeetTokenizer(tokens);
}

describe('ParakeetTokenizer.decode', () => {
  it('preserves space before dollar sign (currency)', () => {
    // SentencePiece: "▁another" + "▁$3,000" → "another $3,000"
    const tokenizer = buildTokenizer(['another', ' $3,000']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('another $3,000');
  });

  it('preserves space before dollar sign mid-sentence', () => {
    const tokenizer = buildTokenizer(['about', ' $50,000']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('about $50,000');
  });

  it('preserves space before euro sign', () => {
    const tokenizer = buildTokenizer(['cost', ' €50']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('cost €50');
  });

  it('preserves space before pound sign', () => {
    const tokenizer = buildTokenizer(['paid', ' £100']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('paid £100');
  });

  it('preserves space before turkish lira sign', () => {
    const tokenizer = buildTokenizer(['fiyat', ' ₺500']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('fiyat ₺500');
  });

  it('attaches punctuation without ▁ marker', () => {
    // SentencePiece: "▁hello" + "." → "hello." (no ▁ on punctuation)
    const tokenizer = buildTokenizer(['hello', '.']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('hello.');
  });

  it('attaches comma without ▁ marker', () => {
    const tokenizer = buildTokenizer(['hello', ',', ' world']);
    const result = tokenizer.decode([0, 1, 2]);
    expect(result).toBe('hello, world');
  });

  it('removes leading whitespace from first token', () => {
    const tokenizer = buildTokenizer([' hello', ' world']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('hello world');
  });

  it('does not add space when dollar sign is leading token', () => {
    const tokenizer = buildTokenizer(['$3,000', ' is']);
    const result = tokenizer.decode([0, 1]);
    expect(result).toBe('$3,000 is');
  });
});
