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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <TrendingUp className="size-4 text-primary" />
          総資産推移
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_GRADIENTS.primary.start.color} stopOpacity={CHART_GRADIENTS.primary.start.opacity} />
                <stop offset="95%" stopColor={CHART_GRADIENTS.primary.end.color} stopOpacity={CHART_GRADIENTS.primary.end.opacity} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 16px 0 rgba(245, 184, 0, 0.12)',
              }}
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
        </div>
      </CardContent>
    </Card>
  );
}
