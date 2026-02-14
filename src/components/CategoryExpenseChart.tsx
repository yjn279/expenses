import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData, YearlyData } from '../types';
import { isMonthlyData, isYearlyData, isNumber, isString } from '../utils/typeGuards';
import { formatCurrency, formatAxisLabel } from '../utils/format';
import { PieChart } from 'lucide-react';
import { CATEGORY_STACK_COLORS, CATEGORY_STACK_ORDER } from '@/constants/chartColors';
import {
  CHART_AXIS,
  CHART_BAR_LAYOUT,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  formatTooltipPeriodLabel,
  formatPeriodLabel,
} from '@/components/chartTheme';
import { ChartCard } from '@/components/ChartCard';

interface CategoryExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  isMonthly: boolean;
}

const STACK_ORDER_SET = new Set<string>(CATEGORY_STACK_ORDER);
const STACK_SEGMENT_RADIUS = 7;
const STACK_GRADIENT_TOP_OPACITY = 0.4;
const STACK_GRADIENT_BOTTOM_OPACITY = 0.24;

export function CategoryExpenseChart({ data, isMonthly }: CategoryExpenseChartProps) {
  const orderedTopToBottom = [...CATEGORY_STACK_ORDER];
  const renderOrderBottomToTop = [...orderedTopToBottom].reverse();
  const categoryOrder = new Map<string, number>(orderedTopToBottom.map((category, index) => [category, index]));

  const chartData = data.map((item) => {
    const period = isMonthly && isMonthlyData(item)
      ? item.month
      : isYearlyData(item)
      ? item.year
      : '';

    const categoryValues: Record<string, number> = Object.fromEntries(
      orderedTopToBottom.map((category) => [category, 0])
    );
    for (const [category, amount] of Object.entries(item.categoryExpense)) {
      const key = STACK_ORDER_SET.has(category) ? category : 'その他';
      categoryValues[key] = (categoryValues[key] || 0) + amount;
    }

    return {
      period,
      periodLabel: formatPeriodLabel(period, isMonthly),
      ...categoryValues,
    };
  });

  return (
    <ChartCard title="カテゴリ別支出" icon={PieChart}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT.tall}>
        <BarChart
          data={chartData}
          margin={CHART_MARGIN}
          barCategoryGap={CHART_BAR_LAYOUT.barCategoryGap}
          barGap={CHART_BAR_LAYOUT.barGap}
          barSize={CHART_BAR_LAYOUT.barSize}
        >
          <defs>
            {orderedTopToBottom.map((category, index) => {
              const color = CATEGORY_STACK_COLORS[index] ?? CATEGORY_STACK_COLORS[CATEGORY_STACK_COLORS.length - 1];
              return (
                <linearGradient key={category} id={`categoryExpenseFill-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="6%" stopColor={color} stopOpacity={STACK_GRADIENT_TOP_OPACITY} />
                  <stop offset="94%" stopColor={color} stopOpacity={STACK_GRADIENT_BOTTOM_OPACITY} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="periodLabel" {...CHART_AXIS} minTickGap={18} />
          <YAxis {...CHART_AXIS} tickFormatter={formatAxisLabel} width={56} />
          <Tooltip
            formatter={(value, name) => (isNumber(value) && isString(name) ? [formatCurrency(value), name] : ['', ''])}
            labelFormatter={formatTooltipPeriodLabel}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            itemSorter={(item) => categoryOrder.get(String(item.name)) ?? Number.MAX_SAFE_INTEGER}
          />
          {renderOrderBottomToTop.map((category) => {
            const colorIndex = categoryOrder.get(category) ?? 0;
            const isTopSegment = category === orderedTopToBottom[0];
            const isBottomSegment = category === orderedTopToBottom[orderedTopToBottom.length - 1];
            return (
              <Bar
                key={category}
                dataKey={category}
                stackId="expense"
                fill={`url(#categoryExpenseFill-${colorIndex})`}
                maxBarSize={CHART_BAR_LAYOUT.maxBarSize}
                radius={
                  isTopSegment
                    ? [STACK_SEGMENT_RADIUS, STACK_SEGMENT_RADIUS, 0, 0]
                    : isBottomSegment
                    ? [0, 0, STACK_SEGMENT_RADIUS, STACK_SEGMENT_RADIUS]
                    : 0
                }
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
