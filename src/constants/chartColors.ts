export const PRIMARY_CHART_COLOR = 'hsl(var(--chart-primary))';

export const DUAL_PALETTE = {
  positive: 'hsl(var(--chart-positive))',
  negative: 'hsl(var(--chart-negative))',
  neutral: 'hsl(var(--chart-neutral))',
} as const;

export const GRADIENT_PALETTE = [
  'hsl(var(--chart-series-1))',
  'hsl(var(--chart-series-2))',
  'hsl(var(--chart-series-3))',
  'hsl(var(--chart-series-4))',
  'hsl(var(--chart-series-5))',
  'hsl(var(--chart-series-6))',
  'hsl(var(--chart-series-7))',
  'hsl(var(--chart-series-8))',
  'hsl(var(--chart-series-9))',
  'hsl(var(--chart-series-10))',
] as const;

export function getSeriesColor(index: number): string {
  return GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];
}

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
