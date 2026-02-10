import { describe, it, expect } from 'vitest';
import { formatDuration } from './time';

describe('formatDuration', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('should format seconds less than a minute correctly', () => {
    expect(formatDuration(30)).toBe('00:30');
    expect(formatDuration(59)).toBe('00:59');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(60)).toBe('01:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('should format hours correctly', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(7200)).toBe('02:00:00');
  });

  it('should handle large durations', () => {
    expect(formatDuration(36000)).toBe('10:00:00');
  });
});
