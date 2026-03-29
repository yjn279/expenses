import type { CSSProperties } from 'react';

export const CHART_HEIGHT = {
  standard: 280,
  tall: 340,
} as const;

export const CHART_MARGIN = {
  top: 12,
  right: 8,
  left: -8,
  bottom: 0,
} as const;

export const CHART_AXIS_TICK = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground) / 0.95)',
} as const;

export const CHART_AXIS = {
  tick: CHART_AXIS_TICK,
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_GRID = {
  stroke: 'hsl(var(--border))',
  strokeOpacity: 0.18,
  strokeDasharray: '2 7',
  vertical: false,
} as const;

export const CHART_BAR_LAYOUT = {
  barCategoryGap: '14%',
  barGap: 1,
  barSize: 36,
  maxBarSize: 56,
} as const;

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: 'hsl(var(--foreground))',
  fontWeight: 600,
};

export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.86)',
  border: '1px solid rgba(255, 255, 255, 0.78)',
  borderRadius: '0.75rem',
  backdropFilter: 'blur(14px) saturate(145%)',
  WebkitBackdropFilter: 'blur(14px) saturate(145%)',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
};

export const CHART_LEGEND_STYLE: CSSProperties = {
  fontSize: 11,
  color: 'hsl(var(--muted-foreground) / 0.95)',
  paddingTop: 8,
};

export function formatTooltipPeriodLabel(
  _: unknown,
  payload?: ReadonlyArray<{ payload?: { period?: string } }>
): string {
  const period = payload?.[0]?.payload?.period;
  return typeof period === 'string' ? period : '';
}

export function formatPeriodLabel(period: string, isMonthly: boolean): string {
  if (!isMonthly) return `${period}年`;
  const [year, month] = period.split('-');
  const monthNumber = Number(month);
  if (!year || Number.isNaN(monthNumber)) return period;
  return monthNumber === 1 ? `${year.slice(2)}/${monthNumber}` : `${monthNumber}月`;
}
