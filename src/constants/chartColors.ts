/**
 * Chart color palette - Golden Sunlight Palette
 *
 * Design theme: 陽だまりの窓 (Sunlight through a window)
 * - Glass: Soft, translucent window pane
 * - Light: Warm golden sunlight gradients
 * - Float: Lightweight, airy elevation
 * - Delicate: Fine window frames and light boundaries
 *
 * Color philosophy: Warm, inviting colors that harmonize with the golden sunlight theme
 */

// Warm color palette - 暖色系パレット
export const WARM_PALETTE = {
  // Main colors - メインカラー（暖色系）
  goldenYellow: '#F59E0B',    // Amber 500 - ゴールデンイエロー
  sunsetOrange: '#FB923C',    // Orange 400 - サンセットオレンジ
  warmCoral: '#F87171',       // Red 400 - ウォームコーラル
  honeyGold: '#FBBF24',       // Amber 400 - ハニーゴールド

  // Accent colors - アクセントカラー
  softPeach: '#FED7AA',       // Orange 200 - ソフトピーチ
  paleGold: '#FEF3C7',        // Amber 100 - ペールゴールド
  roseGold: '#FDA4AF',        // Rose 300 - ローズゴールド

  // Neutral colors - 中性色（グレーがかった暖色）
  warmGray: '#78716C',        // Stone 500 - ウォームグレー
  lightWarm: '#E7E5E4',       // Stone 200 - ライトウォーム
} as const;

// Primary color for total assets chart - golden gradient
export const PRIMARY_CHART_COLOR = WARM_PALETTE.goldenYellow;

// Two-color palette for income/expense comparison
export const DUAL_PALETTE = {
  positive: WARM_PALETTE.honeyGold,   // Honey gold for income
  negative: WARM_PALETTE.warmCoral,   // Warm coral for expense
  neutral: WARM_PALETTE.sunsetOrange, // Sunset orange for profit
} as const;

// Multi-category gradient palette - warm tone focused
export const GRADIENT_PALETTE = [
  WARM_PALETTE.goldenYellow,  // Golden yellow
  WARM_PALETTE.sunsetOrange,  // Sunset orange
  WARM_PALETTE.honeyGold,     // Honey gold
  WARM_PALETTE.warmCoral,     // Warm coral
  WARM_PALETTE.softPeach,     // Soft peach
  WARM_PALETTE.roseGold,      // Rose gold
  '#FB7185',                  // Rose 400
  '#FDBA74',                  // Orange 300
  '#FCD34D',                  // Amber 300
  '#FCA5A5',                  // Red 300
] as const;

// Chart gradients for area fills
export const CHART_GRADIENTS = {
  primary: {
    start: { color: WARM_PALETTE.goldenYellow, opacity: 0.5 },
    end: { color: WARM_PALETTE.honeyGold, opacity: 0.05 },
  },
  positive: {
    start: { color: DUAL_PALETTE.positive, opacity: 0.4 },
    end: { color: DUAL_PALETTE.positive, opacity: 0.05 },
  },
  negative: {
    start: { color: DUAL_PALETTE.negative, opacity: 0.4 },
    end: { color: DUAL_PALETTE.negative, opacity: 0.05 },
  },
} as const;
