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

interface IncomeExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  isMonthly: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAxisLabel(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 100000000) {
    return `${(value / 100000000).toFixed(1)}億`;
  }
  if (absValue >= 10000) {
    return `${(value / 10000).toFixed(0)}万`;
  }
  return value.toString();
}

export function IncomeExpenseChart({ data, isMonthly }: IncomeExpenseChartProps) {
  const chartData = data.map((item) => ({
    period: isMonthly ? (item as MonthlyData).month : (item as YearlyData).year,
    income: item.income,
    expense: -item.expense, // Show as negative for visual clarity
    profit: item.profit,
  }));

  return (
    <div className="chart-container">
      <h3>収支推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={formatAxisLabel}
          />
          <Tooltip
            formatter={(value, name) => {
              const numValue = value as number;
              const strName = name as string;
              const displayValue = strName === 'expense' ? -numValue : numValue;
              const labels: Record<string, string> = {
                income: '収入',
                expense: '支出',
                profit: '収支',
              };
              return [formatCurrency(displayValue), labels[strName] || strName];
            }}
            labelStyle={{ color: '#333' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                income: '収入',
                expense: '支出',
                profit: '収支',
              };
              return labels[value] || value;
            }}
          />
          <ReferenceLine y={0} stroke="#999" />
          <Bar
            dataKey="income"
            fill="#4caf50"
            name="income"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            fill="#f44336"
            name="expense"
            radius={[0, 0, 4, 4]}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#2196f3"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2196f3' }}
            name="profit"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
