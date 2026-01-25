import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import type { MonthlyData, ViewMode } from '../types';

interface KPISummaryPanelProps {
  data: MonthlyData[];
  viewMode: ViewMode;
}

export function KPISummaryPanel({ data, viewMode }: KPISummaryPanelProps) {
  const kpiData = useMemo(() => {
    if (data.length === 0) {
      return {
        totalAssets: 0,
        assetsTrend: 0,
        currentProfit: 0,
        profitTrend: 0,
        periodLabel: '',
      };
    }

    const latestMonth = data[data.length - 1];
    const previousMonth = data.length > 1 ? data[data.length - 2] : null;

    // 期間ラベルを生成
    let periodLabel = '';
    if (viewMode === 'monthly') {
      // "1月" の形式（年を省略）
      const [, month] = latestMonth.month.split('-');
      periodLabel = `${parseInt(month, 10)}月`;
    } else {
      // "2024年" の形式
      periodLabel = `${latestMonth.month.split('-')[0]}年`;
    }

    // 総資産のトレンド計算
    const assetsTrend = previousMonth
      ? ((latestMonth.totalAssets - previousMonth.totalAssets) / previousMonth.totalAssets) * 100
      : 0;

    // 収支のトレンド計算（前月比）
    const profitTrend = previousMonth && previousMonth.profit !== 0
      ? ((latestMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit)) * 100
      : 0;

    return {
      totalAssets: latestMonth.totalAssets,
      assetsTrend,
      currentProfit: latestMonth.profit,
      profitTrend,
      periodLabel,
    };
  }, [data, viewMode]);

  const { totalAssets, assetsTrend, currentProfit, profitTrend, periodLabel } = kpiData;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 総資産カード */}
      <div
        className="glass-card rounded-2xl p-4 animate-fade-in"
        style={{ animationDelay: '0s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="size-3.5 shrink-0" />
              <span>総資産</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground mb-1 truncate">
              {formatCurrency(totalAssets)}
            </div>
            <div className="flex items-center gap-1 text-xs flex-wrap">
              {assetsTrend >= 0 ? (
                <>
                  <TrendingUp className="size-3 text-emerald-600 shrink-0" />
                  <span className="text-emerald-600 font-medium">
                    +{assetsTrend.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-rose-500 shrink-0" />
                  <span className="text-rose-500 font-medium">
                    {assetsTrend.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">前月比</span>
            </div>
          </div>
        </div>
      </div>

      {/* 収支カード */}
      <div
        className="glass-card rounded-2xl p-4 animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CreditCard className="size-3.5 shrink-0" />
              <span>{periodLabel}の収支</span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold mb-1 truncate ${
                currentProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {currentProfit >= 0 ? '+' : ''}
              {formatCurrency(currentProfit)}
            </div>
            <div className="flex items-center gap-1 text-xs flex-wrap">
              {profitTrend >= 0 ? (
                <>
                  <TrendingUp className="size-3 text-emerald-600 shrink-0" />
                  <span className="text-emerald-600 font-medium">
                    +{profitTrend.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-rose-500 shrink-0" />
                  <span className="text-rose-500 font-medium">
                    {profitTrend.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">前月比</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
