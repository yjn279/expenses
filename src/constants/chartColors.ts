/**
 * Chart color palette - Improved color distinguishability
 *
 * Design theme: 陽だまりの窓 (Sunlight through a window)
 * - Glass: Soft, translucent window pane
 * - Light: Warm golden sunlight gradients
 * - Float: Lightweight, airy elevation
 * - Delicate: Fine window frames and light boundaries
 * 
 * Color philosophy: Use distinct, easily distinguishable colors for better data visualization
 */

// Primary color for total assets chart - blue gradient (growth & assets)
export const PRIMARY_CHART_COLOR = '#3B82F6'; // Blue

// Two-color palette for income/expense comparison
export const DUAL_PALETTE = {
  positive: '#22C55E',  // Green for income
  negative: '#EF4444',  // Red for expense
  neutral: '#3B82F6',   // Blue for profit
} as const;

// Multi-category gradient palette (10 colors)
// Diverse palette with blue, green, purple, orange, pink, etc. for easy distinction
export const GRADIENT_PALETTE = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
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
