import type { CSSProperties } from 'react';

export const CHART_HEIGHT = {
  standard: 300,
  tall: 350,
} as const;

export const CHART_MARGIN = {
  top: 8,
  right: 8,
  left: 0,
  bottom: 4,
} as const;

export const CHART_AXIS_TICK = {
  fontSize: 12,
  fill: 'hsl(var(--muted-foreground))',
} as const;

export const CHART_GRID = {
  stroke: 'hsl(var(--border))',
  strokeOpacity: 0.28,
  strokeDasharray: '3 3',
  vertical: false,
} as const;

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: 'hsl(var(--foreground))',
  fontWeight: 500,
};

export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  border: '1px solid rgba(255, 255, 255, 0.72)',
  borderRadius: 'var(--radius)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.09)',
};

export const CHART_LEGEND_STYLE: CSSProperties = {
  fontSize: 12,
  color: 'hsl(var(--muted-foreground))',
};
