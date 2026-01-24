/**
 * Chart color palette based on "Sunlight through window" concept
 *
 * Design theme: 陽だまりの窓 (Sunlight through a window)
 * - Glass: Soft, translucent window pane
 * - Light: Warm golden sunlight gradients
 * - Float: Lightweight, airy elevation
 * - Delicate: Fine window frames and light boundaries
 */

// Primary color for single-series charts
export const PRIMARY_CHART_COLOR = '#F5B800';

// Two-color palette for income/expense comparison
export const DUAL_PALETTE = {
  positive: '#FFB74D',  // Warm golden for income
  negative: '#FF8A80',  // Soft coral for expense
  neutral: '#F9A825',   // Deep golden for profit
} as const;

// Multi-category gradient palette (10 colors)
// Cream to deep amber - yellow tones only
export const GRADIENT_PALETTE = [
  '#FFF9C4', '#FFE082', '#FFD54F', '#FFCA28', '#FFB74D',
  '#FFA726', '#FF9800', '#F9A825', '#F57C00', '#E65100',
] as const;

// Chart gradients for area fills
export const CHART_GRADIENTS = {
  primary: {
    start: { color: PRIMARY_CHART_COLOR, opacity: 0.5 },
    end: { color: PRIMARY_CHART_COLOR, opacity: 0.05 },
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
