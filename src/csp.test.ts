import { describe, it, expect } from 'vitest';
import { Window } from 'happy-dom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Content Security Policy', () => {
  it('should be present in index.html', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const window = new Window();
    const document = window.document;
    document.write(html);

    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(meta).not.toBeNull();

    const content = meta?.getAttribute('content') || '';

    // Check for critical directives
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("script-src 'self'");
    expect(content).toContain("object-src 'none'");

    // Check specific allowances
    expect(content).toContain('https://huggingface.co');
    expect(content).toContain('https://*.hf.co');
    expect(content).toContain('blob:'); // For workers
    expect(content).toContain("worker-src 'self' blob:");
  });
});
