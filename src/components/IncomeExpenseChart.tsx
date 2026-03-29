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
import { ArrowUpDown } from 'lucide-react';
import { CHART_GRADIENTS, DUAL_PALETTE, PRIMARY_CHART_COLOR } from '@/constants/chartColors';
import {
  CHART_AXIS,
  CHART_BAR_LAYOUT,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_LEGEND_STYLE,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  formatTooltipPeriodLabel,
  formatPeriodLabel,
} from '@/components/chartTheme';
import { ChartCard } from '@/components/ChartCard';

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
      periodLabel: formatPeriodLabel(period, isMonthly),
      income: item.income,
      expense: -item.expense,
      profit: item.profit,
    };
  });

  return (
    <ChartCard title="収支推移" icon={ArrowUpDown}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT.standard}>
        <ComposedChart
          data={chartData}
          margin={CHART_MARGIN}
          stackOffset="sign"
          barCategoryGap={CHART_BAR_LAYOUT.barCategoryGap}
          barGap={CHART_BAR_LAYOUT.barGap}
          barSize={CHART_BAR_LAYOUT.barSize}
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="4%" stopColor={CHART_GRADIENTS.positive.start.color} stopOpacity={CHART_GRADIENTS.positive.start.opacity} />
              <stop offset="96%" stopColor={CHART_GRADIENTS.positive.end.color} stopOpacity={CHART_GRADIENTS.positive.end.opacity} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="4%" stopColor={CHART_GRADIENTS.negative.end.color} stopOpacity={CHART_GRADIENTS.negative.end.opacity} />
              <stop offset="96%" stopColor={CHART_GRADIENTS.negative.start.color} stopOpacity={CHART_GRADIENTS.negative.start.opacity} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="periodLabel" {...CHART_AXIS} minTickGap={18} />
          <YAxis {...CHART_AXIS} domain={['dataMin', 'dataMax']} tickFormatter={formatAxisLabel} width={56} />
          <Tooltip
            formatter={(value, name) => {
              if (!isNumber(value) || !isString(name)) return ['', ''];
              const displayValue = name === 'expense' ? -value : value;
              return [formatCurrency(displayValue), LABELS[name] || name];
            }}
            labelFormatter={formatTooltipPeriodLabel}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
          />
          <Legend formatter={(value: string) => LABELS[value] || value} wrapperStyle={CHART_LEGEND_STYLE} iconType="circle" />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
          <Bar
            dataKey="income"
            stackId="cashflow"
            fill="url(#incomeFill)"
            name="income"
            stroke={DUAL_PALETTE.positive}
            strokeOpacity={0}
            radius={[6, 6, 0, 0]}
            maxBarSize={CHART_BAR_LAYOUT.maxBarSize}
          />
          <Bar
            dataKey="expense"
            stackId="cashflow"
            fill="url(#expenseFill)"
            name="expense"
            stroke={DUAL_PALETTE.negative}
            strokeOpacity={0}
            radius={[6, 6, 0, 0]}
            maxBarSize={CHART_BAR_LAYOUT.maxBarSize}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke={PRIMARY_CHART_COLOR}
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4, fill: PRIMARY_CHART_COLOR, strokeWidth: 0 }}
            name="profit"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
