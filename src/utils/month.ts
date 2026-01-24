/**
 * 月文字列を YYYY-MM 形式に正規化
 * @param monthStr - 正規化する月文字列（YYYY-MM形式またはDate文字列）
 * @returns 正規化された月文字列（YYYY-MM形式）、またはnull（無効な場合）
 */
export function normalizeMonth(monthStr: string): string | null {
  if (!monthStr || typeof monthStr !== 'string') return null;
  
  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    return monthStr;
  }
  
  // Try to parse as date (handles Date strings like 'Mon Sep 01 2025...' or ISO format)
  const date = new Date(monthStr);
  if (!isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  
  return null;
}
