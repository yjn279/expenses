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

/**
 * カテゴリ別支出グラフのプロパティ
 */
interface CategoryExpenseChartProps {
  /** 表示するデータ（月次または年次） */
  data: MonthlyData[] | YearlyData[];
  /** 表示するカテゴリの配列 */
  categories: string[];
  /** 月次データかどうか */
  isMonthly: boolean;
}

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
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
    <div className="chart-container">
      <h3>カテゴリ別支出</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
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
              return [formatCurrency(value), name];
            }}
            labelStyle={{ color: '#333' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
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
    </div>
  );
}
