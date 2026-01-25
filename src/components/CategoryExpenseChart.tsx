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

interface CategoryExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  categories: string[];
  isMonthly: boolean;
}

// Warm, inviting color palette
const COLORS = [
  '#FF8A80',  // Rose coral
  '#FFB74D',  // Warm orange
  '#FFD54F',  // Golden yellow
  '#81C784',  // Soft green
  '#4ECDC4',  // Mint
  '#64B5F6',  // Sky blue
  '#9575CD',  // Soft purple
  '#F06292',  // Pink
  '#A1887F',  // Warm brown
  '#90A4AE',  // Blue grey
  '#AED581',  // Light green
  '#4DD0E1',  // Cyan
  '#BA68C8',  // Purple
  '#FF8A65',  // Deep orange
  '#DCE775',  // Lime
  '#7986CB',  // Indigo
];

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
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.7}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
