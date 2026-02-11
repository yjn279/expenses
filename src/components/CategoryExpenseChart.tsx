import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData, YearlyData } from '../types';
import { isMonthlyData, isYearlyData, isNumber, isString } from '../utils/typeGuards';
import { formatCurrency, formatAxisLabel } from '../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import { GRADIENT_PALETTE } from '@/constants/chartColors';
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_LEGEND_STYLE,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '@/components/chartTheme';

interface CategoryExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  categories: string[];
  isMonthly: boolean;
}

export function CategoryExpenseChart({
  data,
  categories,
  isMonthly,
}: CategoryExpenseChartProps) {
  const chartData = data.map((item) => {
    const period = isMonthly && isMonthlyData(item)
      ? item.month
      : isYearlyData(item)
      ? item.year
      : '';

    const categoryValues: Record<string, number> = {};
    for (const category of categories) {
      categoryValues[category] = item.categoryExpense[category] || 0;
    }

    return { period, ...categoryValues };
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PieChart className="size-4 text-primary" />
          カテゴリ別支出
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.tall}>
          <AreaChart data={chartData} margin={CHART_MARGIN}>
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
                return [formatCurrency(value), name];
              }}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Legend wrapperStyle={CHART_LEGEND_STYLE} />
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                fill={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                fillOpacity={0.68}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
