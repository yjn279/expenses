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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  formatPeriodLabel,
} from '@/components/chartTheme';

interface CategoryExpenseChartProps {
  data: MonthlyData[] | YearlyData[];
  categories: string[];
  isMonthly: boolean;
}

const STACK_ORDER_TOP_TO_BOTTOM = [
  '住宅',
  '水道・光熱費',
  '食費',
  '日用品',
  '特別な支出',
  'その他',
] as const;
const STACK_ORDER_SET = new Set<string>(STACK_ORDER_TOP_TO_BOTTOM);
const STACK_COLORS_BY_ORDER = [
  'hsl(var(--chart-primary))',
  'hsl(var(--chart-series-1))',
  'hsl(var(--chart-series-2))',
  'hsl(var(--chart-series-3))',
  'hsl(var(--chart-series-4))',
  'hsl(var(--chart-series-10))',
] as const;
const STACK_SEGMENT_RADIUS = 7;
const STACK_GRADIENT_TOP_OPACITY = 0.4;
const STACK_GRADIENT_BOTTOM_OPACITY = 0.24;

export function CategoryExpenseChart({
  data,
  isMonthly,
}: CategoryExpenseChartProps) {
  const orderedTopToBottom = [...STACK_ORDER_TOP_TO_BOTTOM];
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
    <Card className="glass-card">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium sm:text-base">
          <PieChart className="size-4 text-primary" />
          カテゴリ別支出
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {orderedTopToBottom.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-white/30 text-sm text-muted-foreground">
            カテゴリデータがありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.tall}>
            <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="14%" barGap={1} barSize={36}>
              <defs>
                {orderedTopToBottom.map((category, index) => {
                  const color = STACK_COLORS_BY_ORDER[index] ?? STACK_COLORS_BY_ORDER[STACK_COLORS_BY_ORDER.length - 1];
                  return (
                    <linearGradient key={category} id={`categoryExpenseFill-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="6%" stopColor={color} stopOpacity={STACK_GRADIENT_TOP_OPACITY} />
                      <stop offset="94%" stopColor={color} stopOpacity={STACK_GRADIENT_BOTTOM_OPACITY} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis
                dataKey="periodLabel"
                {...CHART_AXIS}
                minTickGap={18}
              />
              <YAxis
                {...CHART_AXIS}
                tickFormatter={formatAxisLabel}
                width={56}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (!isNumber(value) || !isString(name)) {
                    return ['', ''];
                  }
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(_, payload) => {
                  const period = payload?.[0]?.payload?.period;
                  return typeof period === 'string' ? period : '';
                }}
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
                    maxBarSize={56}
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
        )}
      </CardContent>
    </Card>
  );
}
