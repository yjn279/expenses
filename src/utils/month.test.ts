import { describe, it, expect } from 'vitest';
import { normalizeMonth } from './month';

describe('normalizeMonth', () => {
  it('should return the same string for YYYY-MM format', () => {
    expect(normalizeMonth('2025-01')).toBe('2025-01');
  });

  it('should parse Date string to YYYY-MM format', () => {
    expect(normalizeMonth('Mon Sep 01 2025 00:00:00 GMT+0900')).toBe('2025-09');
  });

  it('should return null for invalid input', () => {
    expect(normalizeMonth('invalid')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(normalizeMonth('')).toBeNull();
  });

  it('should parse ISO format date string', () => {
    expect(normalizeMonth('2025-09-01T00:00:00.000Z')).toBe('2025-09');
  });

  it('should handle December correctly', () => {
    expect(normalizeMonth('2025-12')).toBe('2025-12');
  });

  it('should handle January correctly', () => {
    expect(normalizeMonth('2025-01')).toBe('2025-01');
  });
});
