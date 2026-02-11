import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlyData, YearlyData } from '../types';
import { isMonthlyData, isYearlyData, isNumber, isString } from '../utils/typeGuards';
import { formatCurrency, formatAxisLabel } from '../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { DUAL_PALETTE } from '@/constants/chartColors';
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_LEGEND_STYLE,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '@/components/chartTheme';

interface IncomeExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  isMonthly: boolean;
}

const LABELS: Record<string, string> = {
  income: '収入',
  expense: '支出',
  profit: '収支',
};

export function IncomeExpenseChart({ data, isMonthly }: IncomeExpenseChartProps) {
  const chartData = data.map((item) => {
    const period = isMonthly && isMonthlyData(item)
      ? item.month
      : isYearlyData(item)
      ? item.year
      : '';

    return {
      period,
      income: item.income,
      expense: -item.expense,
      profit: item.profit,
    };
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ArrowUpDown className="size-4 text-primary" />
          収支推移
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.standard}>
          <ComposedChart data={chartData} margin={CHART_MARGIN}>
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
              formatter={(value, name) => {
                if (!isNumber(value) || !isString(name)) {
                  return ['', ''];
                }
                const displayValue = name === 'expense' ? -value : value;
                return [formatCurrency(displayValue), LABELS[name] || name];
              }}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Legend
              formatter={(value: string) => LABELS[value] || value}
              wrapperStyle={CHART_LEGEND_STYLE}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.45} />
            <Bar
              dataKey="income"
              fill={DUAL_PALETTE.positive}
              name="income"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
            <Bar
              dataKey="expense"
              fill={DUAL_PALETTE.negative}
              name="expense"
              radius={[0, 0, 4, 4]}
              opacity={0.85}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke={DUAL_PALETTE.neutral}
              strokeWidth={2.5}
              dot={{ r: 4, fill: DUAL_PALETTE.neutral }}
              name="profit"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
