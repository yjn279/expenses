import type { MonthlyData, YearlyData } from '../types';

/**
 * Type guard to check if an item is MonthlyData
 * @param item - Item to check
 * @returns True if item has 'month' property
 */
export function isMonthlyData(item: MonthlyData | YearlyData): item is MonthlyData {
  return 'month' in item;
}

/**
 * Type guard to check if an item is YearlyData
 * @param item - Item to check
 * @returns True if item has 'year' property
 */
export function isYearlyData(item: MonthlyData | YearlyData): item is YearlyData {
  return 'year' in item;
}

/**
 * Type guard to check if a value is a number
 * @param value - Value to check
 * @returns True if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Type guard to check if a value is a string
 * @param value - Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
