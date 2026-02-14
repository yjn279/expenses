import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData, YearlyData } from '../types';
import { isMonthlyData, isYearlyData, isNumber } from '../utils/typeGuards';
import { formatCurrency, formatAxisLabel } from '../utils/format';
import { TrendingUp } from 'lucide-react';
import { PRIMARY_CHART_COLOR, CHART_GRADIENTS } from '@/constants/chartColors';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  formatTooltipPeriodLabel,
  formatPeriodLabel,
} from '@/components/chartTheme';
import { ChartCard } from '@/components/ChartCard';

interface TotalAssetsChartProps {
  data: MonthlyData[] | YearlyData[];
  isMonthly: boolean;
}

export function TotalAssetsChart({ data, isMonthly }: TotalAssetsChartProps) {
  const chartData = data.map((item) => {
    const period = isMonthly && isMonthlyData(item)
      ? item.month
      : isYearlyData(item)
      ? item.year
      : '';

    return {
      period,
      periodLabel: formatPeriodLabel(period, isMonthly),
      totalAssets: item.totalAssets,
    };
  });

  return (
    <ChartCard title="総資産推移" icon={TrendingUp}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT.standard}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_GRADIENTS.primary.start.color} stopOpacity={CHART_GRADIENTS.primary.start.opacity} />
              <stop offset="95%" stopColor={CHART_GRADIENTS.primary.end.color} stopOpacity={CHART_GRADIENTS.primary.end.opacity} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="periodLabel" {...CHART_AXIS} minTickGap={18} />
          <YAxis {...CHART_AXIS} tickFormatter={formatAxisLabel} width={56} />
          <Tooltip
            formatter={(value) => (isNumber(value) ? [formatCurrency(value), '総資産'] : ['', ''])}
            labelFormatter={formatTooltipPeriodLabel}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
          />
          <Area
            type="monotone"
            dataKey="totalAssets"
            stroke={PRIMARY_CHART_COLOR}
            strokeWidth={2.25}
            fill="url(#colorAssets)"
            activeDot={{ r: 4, fill: PRIMARY_CHART_COLOR, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
