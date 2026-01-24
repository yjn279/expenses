/**
 * 数値を日本円の通貨形式でフォーマット
 * @param value - フォーマットする数値
 * @returns フォーマットされた通貨文字列（例: "¥1,000"）
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 数値をグラフの軸ラベル用にフォーマット（億、万単位に変換）
 * @param value - フォーマットする数値（負の値もサポート）
 * @returns フォーマットされた文字列（例: "1.5億", "10万", "1000"）
 */
export function formatAxisLabel(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 100000000) {
    return `${(value / 100000000).toFixed(1)}億`;
  }
  if (absValue >= 10000) {
    return `${(value / 10000).toFixed(0)}万`;
  }
  return value.toString();
}
