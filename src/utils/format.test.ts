import { describe, it, expect } from 'vitest';
import { formatCurrency, formatAxisLabel } from './format';

describe('formatCurrency', () => {
  it('should format positive value correctly', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
    expect(result).toMatch(/[¥￥]1,000/);
  });

  it('should format negative value correctly', () => {
    const result = formatCurrency(-1000);
    expect(result).toContain('1,000');
    expect(result).toMatch(/-[¥￥]1,000/);
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toMatch(/[¥￥]0/);
  });

  it('should format large value correctly', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1,000,000');
    expect(result).toMatch(/[¥￥]1,000,000/);
  });
});

describe('formatAxisLabel', () => {
  it('should format value in 億 unit when >= 100000000', () => {
    expect(formatAxisLabel(100000000)).toBe('1.0億');
  });

  it('should format value in 万 unit when >= 10000 and < 100000000', () => {
    expect(formatAxisLabel(10000)).toBe('1万');
  });

  it('should format value without unit when < 10000', () => {
    expect(formatAxisLabel(1000)).toBe('1000');
  });

  it('should handle negative 億 values', () => {
    expect(formatAxisLabel(-100000000)).toBe('-1.0億');
  });

  it('should handle negative 万 values', () => {
    expect(formatAxisLabel(-10000)).toBe('-1万');
  });

  it('should handle negative values without unit', () => {
    expect(formatAxisLabel(-1000)).toBe('-1000');
  });
});
