import { useMemo } from 'react';
import { CreditCard, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import type { MonthlyData, ViewMode } from '../types';
import { formatCurrency } from '../utils/format';

interface KPISummaryPanelProps {
  data: MonthlyData[];
  viewMode: ViewMode;
}

const cardClass = 'glass-card rounded-2xl p-4 sm:p-5 min-w-0 flex flex-col gap-1.5';
const trendUpClass = 'text-[hsl(var(--success))]';
const trendDownClass = 'text-[hsl(var(--danger))]';

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const toneClass = isPositive ? trendUpClass : trendDownClass;
  return (
    <>
      <Icon className={`size-3 shrink-0 ${toneClass}`} />
      <span className={`font-semibold ${toneClass}`}>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
    </>
  );
}

export function KPISummaryPanel({ data, viewMode }: KPISummaryPanelProps) {
  const { totalAssets, assetsTrend, currentProfit, profitTrend, periodLabel } = useMemo(() => {
    if (!data.length) return { totalAssets: 0, assetsTrend: 0, currentProfit: 0, profitTrend: 0, periodLabel: '' };

    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const monthLabel = `${parseInt(latest.month.split('-')[1], 10)}月`;
    const yearLabel = `${latest.month.split('-')[0]}年`;
    const assetsTrend = previous && previous.totalAssets !== 0 ? ((latest.totalAssets - previous.totalAssets) / previous.totalAssets) * 100 : 0;
    const profitTrend = previous && previous.profit !== 0 ? ((latest.profit - previous.profit) / Math.abs(previous.profit)) * 100 : 0;

    return {
      totalAssets: latest.totalAssets,
      assetsTrend,
      currentProfit: latest.profit,
      profitTrend,
      periodLabel: viewMode === 'monthly' ? monthLabel : yearLabel,
    };
  }, [data, viewMode]);

  const isProfitPositive = currentProfit >= 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className={cardClass}>
        <div className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <DollarSign className="size-3.5 shrink-0" />
          <span>総資産</span>
        </div>
        <div className="truncate text-[var(--font-size-kpi)] leading-[var(--line-height-dense)] font-bold text-foreground">
          {formatCurrency(totalAssets)}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <TrendBadge value={assetsTrend} />
          <span className="text-muted-foreground">前月比</span>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="size-3.5 shrink-0" />
          <span>{periodLabel}の収支</span>
        </div>
        <div className={`truncate text-[var(--font-size-kpi)] leading-[var(--line-height-dense)] font-bold ${isProfitPositive ? trendUpClass : trendDownClass}`}>
          {isProfitPositive ? '+' : ''}
          {formatCurrency(currentProfit)}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <TrendBadge value={profitTrend} />
          <span className="text-muted-foreground">前月比</span>
        </div>
      </div>
    </div>
  );
}
