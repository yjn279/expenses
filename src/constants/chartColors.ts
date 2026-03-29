export const PRIMARY_CHART_COLOR = 'hsl(var(--chart-primary))';

export const DUAL_PALETTE = {
  positive: 'hsl(var(--chart-positive))',
  negative: 'hsl(var(--chart-negative))',
} as const;

export const CATEGORY_STACK_ORDER = ['住宅', '水道・光熱費', '食費', '日用品', '特別な支出', 'その他'] as const;
export const CATEGORY_STACK_COLORS = [
  'hsl(var(--chart-primary))',
  'hsl(var(--chart-series-1))',
  'hsl(var(--chart-series-2))',
  'hsl(var(--chart-series-3))',
  'hsl(var(--chart-series-4))',
  'hsl(var(--chart-series-10))',
] as const;

export const CHART_GRADIENTS = {
  primary: {
    start: { color: PRIMARY_CHART_COLOR, opacity: 0.42 },
    end: { color: PRIMARY_CHART_COLOR, opacity: 0.04 },
  },
  positive: {
    start: { color: DUAL_PALETTE.positive, opacity: 0.34 },
    end: { color: DUAL_PALETTE.positive, opacity: 0.05 },
  },
  negative: {
    start: { color: DUAL_PALETTE.negative, opacity: 0.34 },
    end: { color: DUAL_PALETTE.negative, opacity: 0.05 },
  },
} as const;
