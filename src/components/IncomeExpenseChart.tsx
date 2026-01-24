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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ArrowUpDown className="size-4 text-primary" />
          収支推移
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(240, 248, 255, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
                const displayValue = name === 'expense' ? -value : value;
                return [formatCurrency(displayValue), LABELS[name] || name];
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
              formatter={(value: string) => LABELS[value] || value}
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
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
        </div>
      </CardContent>
    </Card>
  );
}
