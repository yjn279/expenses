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

/**
 * 総資産推移グラフのプロパティ
 */
interface TotalAssetsChartProps {
  /** 表示するデータ（月次または年次） */
  data: MonthlyData[] | YearlyData[];
  /** 月次データかどうか */
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
    <div className="chart-container">
      <h3>総資産推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
            formatter={(value) => {
              if (!isNumber(value)) {
                return ['', ''];
              }
              return [formatCurrency(value), '総資産'];
            }}
            labelStyle={{ color: '#333' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Area
            type="monotone"
            dataKey="totalAssets"
            stroke="#4caf50"
            strokeWidth={2}
            fill="url(#colorAssets)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
