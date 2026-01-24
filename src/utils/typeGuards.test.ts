import { describe, it, expect } from 'vitest';
import { isMonthlyData, isYearlyData, isNumber, isString } from './typeGuards';
import type { MonthlyData, YearlyData } from '../types';

const createMonthlyData = (): MonthlyData => ({
  month: '2025-01',
  income: 100000,
  expense: 50000,
  profit: 50000,
  totalAssets: 1000000,
  categoryExpense: {},
});

const createYearlyData = (): YearlyData => ({
  year: '2025',
  income: 1200000,
  expense: 600000,
  profit: 600000,
  totalAssets: 1000000,
  categoryExpense: {},
});

describe('isMonthlyData', () => {
  it('should return true for MonthlyData', () => {
    const monthlyData = createMonthlyData();
    expect(isMonthlyData(monthlyData)).toBe(true);
  });

  it('should return false for YearlyData', () => {
    const yearlyData = createYearlyData();
    expect(isMonthlyData(yearlyData)).toBe(false);
  });
});

describe('isYearlyData', () => {
  it('should return true for YearlyData', () => {
    const yearlyData = createYearlyData();
    expect(isYearlyData(yearlyData)).toBe(true);
  });

  it('should return false for MonthlyData', () => {
    const monthlyData = createMonthlyData();
    expect(isYearlyData(monthlyData)).toBe(false);
  });
});

describe('isNumber', () => {
  it('should return true for number', () => {
    expect(isNumber(100)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-100)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
  });

  it('should return false for non-number values', () => {
    expect(isNumber('100')).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber([])).toBe(false);
  });
});

describe('isString', () => {
  it('should return true for string', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
    expect(isString('100')).toBe(true);
  });

  it('should return false for non-string values', () => {
    expect(isString(100)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
  });
});
