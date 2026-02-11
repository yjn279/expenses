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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { PRIMARY_CHART_COLOR, CHART_GRADIENTS } from '@/constants/chartColors';
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '@/components/chartTheme';

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

    return { period, totalAssets: item.totalAssets };
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <TrendingUp className="size-4 text-primary" />
          総資産推移
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.standard}>
          <AreaChart data={chartData} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_GRADIENTS.primary.start.color} stopOpacity={CHART_GRADIENTS.primary.start.opacity} />
                <stop offset="95%" stopColor={CHART_GRADIENTS.primary.end.color} stopOpacity={CHART_GRADIENTS.primary.end.opacity} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID} />
            <XAxis
              dataKey="period"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisLabel}
              width={60}
            />
            <Tooltip
              formatter={(value) => {
                if (!isNumber(value)) {
                  return ['', ''];
                }
                return [formatCurrency(value), '総資産'];
              }}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Area
              type="monotone"
              dataKey="totalAssets"
              stroke={PRIMARY_CHART_COLOR}
              strokeWidth={2.5}
              fill="url(#colorAssets)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
