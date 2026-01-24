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

/**
 * 収支推移グラフのプロパティ
 */
interface IncomeExpenseChartProps {
  /** 表示するデータ（月次または年次） */
  data: MonthlyData[] | YearlyData[];
  /** 月次データかどうか */
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
              if (!isNumber(value) || !isString(name)) {
                return ['', ''];
              }
              const displayValue = name === 'expense' ? -value : value;
              return [formatCurrency(displayValue), LABELS[name] || name];
            }}
            labelStyle={{ color: '#333' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Legend formatter={(value: string) => LABELS[value] || value} />
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
