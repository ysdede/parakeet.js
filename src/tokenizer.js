// Simple text tokenizer/decoder for Parakeet models (browser-friendly, fetch-only).

/**
 * Fetch a text file (tokens.txt or vocab.txt) and return its contents.
 * @param {string} url Remote URL or relative path served by the web app.
 */
async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  return resp.text();
}

export class ParakeetTokenizer {
  /**
   * @param {string[]} id2token Array where index=id and value=token string
   */
  constructor(id2token) {
    this.id2token = id2token;
    this.blankToken = '<blk>';
    // Find blank token ID dynamically from vocabulary
    this.blankId = id2token.findIndex(t => t === '<blk>');
    if (this.blankId === -1) {
      console.warn('[ParakeetTokenizer] Blank token <blk> not found in vocabulary, defaulting to 1024');
      this.blankId = 1024;
    }
  }

  static async fromUrl(tokensUrl) {
    const text = await fetchText(tokensUrl);
    const lines = text.split(/\r?\n/).filter(Boolean);
    const id2token = [];
    for (const line of lines) {
      const [tok, idStr] = line.split(/\s+/);
      const id = parseInt(idStr, 10);
      id2token[id] = tok;
    }
    return new ParakeetTokenizer(id2token);
  }

  /**
   * Decode an array of token IDs into a human readable string.
   * Implements the SentencePiece rule where leading `▁` marks a space.
   * Matches the Python reference regex pattern: r"\A\s|\s\B|(\s)\b"
   * @param {number[]} ids
   * @returns {string}
   */
  decode(ids) {
    // First pass: convert tokens to text with ▁ → space
    const tokens = [];
    for (const id of ids) {
      const token = this.id2token[id];
      if (token === undefined) continue;
      if (token === this.blankToken) continue;
      // Replace SentencePiece marker with space (matching Python vocab loading)
      tokens.push(token.replace(/\u2581/g, ' '));
    }
    
    // Join all tokens
    let text = tokens.join('');
    
    // Apply the same regex pattern as Python reference:
    // Pattern: r"\A\s|\s\B|(\s)\b"
    // - \A\s: Remove leading whitespace
    // - \s\B: Remove whitespace before non-word boundaries
    // - (\s)\b: Keep space at word boundaries (captured group)
    text = text.replace(/^\s+/, '');  // Remove leading whitespace (\A\s)
    text = text.replace(/\s+(?=[^\w\s])/g, '');  // Remove space before punctuation (\s\B approximation)
    text = text.replace(/\s+/g, ' ');  // Normalize multiple spaces to single space
    
    return text.trim();
  }
} 