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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PieChart className="size-4 text-primary" />
          カテゴリ別支出
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
              formatter={(value, name) => {
                if (!isNumber(value) || !isString(name)) {
                  return ['', ''];
                }
                return [formatCurrency(value), name];
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
            <Legend
              wrapperStyle={{ fontSize: 12 }}
            />
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                fill={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]}
                fillOpacity={0.75}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
