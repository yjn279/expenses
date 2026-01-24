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
export function normalizeMonth(monthStr: string): MonthString | null {
  if (!monthStr || typeof monthStr !== 'string') return null;
  
  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    return monthStr as MonthString;
  }
  
  // Try to parse as date (handles Date strings like 'Mon Sep 01 2025...' or ISO format)
  const date = new Date(monthStr);
  if (!isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` as MonthString;
  }
  
  return null;
}
