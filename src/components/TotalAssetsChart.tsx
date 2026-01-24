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

interface TotalAssetsChartProps {
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
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}億`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}万`;
  }
  return value.toString();
}

export function TotalAssetsChart({ data, isMonthly }: TotalAssetsChartProps) {
  const chartData = data.map((item) => ({
    period: isMonthly ? (item as MonthlyData).month : (item as YearlyData).year,
    totalAssets: item.totalAssets,
  }));

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
            formatter={(value) => [formatCurrency(value as number), '総資産']}
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
