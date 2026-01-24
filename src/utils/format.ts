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

const OKU = 100000000;
const MAN = 10000;

/**
 * 数値をグラフの軸ラベル用にフォーマット（億、万単位に変換）
 * @param value - フォーマットする数値（負の値もサポート）
 * @returns フォーマットされた文字列（例: "1.5億", "10万", "1000"）
 */
export function formatAxisLabel(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= OKU) {
    return `${(value / OKU).toFixed(1)}億`;
  }
  
  if (absValue >= MAN) {
    return `${(value / MAN).toFixed(0)}万`;
  }
  
  return value.toString();
}
