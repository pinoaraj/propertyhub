import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime, formatDateTime, getInitials, truncate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15T12:00:00');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('formats string date', () => {
    expect(formatDate('2024-01-15T12:00:00')).toBe('Jan 15, 2024');
  });
});

describe('formatTime', () => {
  it('formats time correctly', () => {
    const date = new Date('2024-01-15T14:30:00');
    expect(formatTime(date)).toContain('2:30');
  });
});

describe('formatDateTime', () => {
  it('formats date and time correctly', () => {
    const date = new Date('2024-01-15T14:30:00');
    expect(formatDateTime(date)).toContain('Jan 15');
    expect(formatDateTime(date)).toContain('2:30');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles multiple spaces', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns original if shorter than limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});