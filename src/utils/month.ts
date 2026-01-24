import type { MonthString } from '../types';

/**
 * 月文字列を YYYY-MM 形式に正規化
 * 
 * @param monthStr - 正規化する月文字列。以下の形式をサポート:
 *   - YYYY-MM形式の文字列（例: "2025-01"）
 *   - Dateオブジェクトの文字列表現（例: "Mon Sep 01 2025..."）
 *   - ISO形式の日付文字列
 * @returns 正規化された月文字列（YYYY-MM形式）、またはnull（無効な場合）
 * 
 * @example
 * normalizeMonth("2025-01") // "2025-01"
 * normalizeMonth("Mon Sep 01 2025 00:00:00 GMT+0900") // "2025-09"
 * normalizeMonth("invalid") // null
 */
const YYYY_MM_PATTERN = /^\d{4}-\d{2}$/;

export function normalizeMonth(monthStr: string): MonthString | null {
  if (!monthStr || typeof monthStr !== 'string') {
    return null;
  }
  
  if (YYYY_MM_PATTERN.test(monthStr)) {
    return monthStr as MonthString;
  }
  
  const date = new Date(monthStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` as MonthString;
  }
  
  return null;
}
