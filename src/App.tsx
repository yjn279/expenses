import { useState, useMemo } from 'react';
import { useHouseholdData } from './hooks/useHouseholdData';
import { addTransactions, updateBalance } from './api/household';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { BulkTransactionForm } from './components/BulkTransactionForm';
import { KPISummaryPanel } from './components/KPISummaryPanel';
import { normalizeMonth } from './utils/month';
import type { ViewMode, TransactionInput, MonthString } from './types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, RefreshCw, AlertCircle, Wallet } from 'lucide-react';

// iOS-style Switch Component
function ViewModeSwitch({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string }[] = [
    { value: 'monthly', label: '月別' },
    { value: 'yearly', label: '年別' },
  ];

  const activeIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div className="ios-switch">
      {/* スライドするインジケーター */}
      <div
        className="ios-switch-indicator"
        style={{
          left: activeIndex === 0 ? '4px' : '50%',
          width: 'calc(50% - 4px)',
        }}
      />
      {/* オプションボタン */}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ios-switch-option"
          data-active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { data, loading, error, refetch } = useHouseholdData();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [showForm, setShowForm] = useState(false);

  const displayData = useMemo(() => {
    if (!data) return { chartData: [], categories: [] };

    if (viewMode === 'monthly') {
      return {
        chartData: data.monthlyData.slice(-12),
        categories: data.categories,
      };
    }

    return {
      chartData: data.yearlyData,
      categories: data.categories,
    };
  }, [data, viewMode]);

  const selectableMonths = useMemo(() => {
    if (!data) return [];

    const existingMonths = new Set(
      data.monthlyData
        .map((d) => normalizeMonth(d.month))
        .filter((m): m is MonthString => m !== null)
    );

    let startMonth = normalizeMonth(data.settings.startMonth);
    if (!startMonth && data.monthlyData.length > 0) {
      startMonth = normalizeMonth(data.monthlyData[0].month);
    }
    if (!startMonth) return [];

    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const months: MonthString[] = [];
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    let currentYear = startYear;
    let currentMonth = startMonthNum;
    const endYear = twoMonthsAgo.getFullYear();
    const endMonth = twoMonthsAgo.getMonth() + 1;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}` as MonthString;
      if (!existingMonths.has(monthStr)) {
        months.push(monthStr);
      }
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return months;
  }, [data]);

  const handleAddTransactions = async (inputs: TransactionInput[]): Promise<void> => {
    await addTransactions(inputs);
    refetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="glass-header fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl px-4 py-3 md:w-[calc(100%-4rem)] md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-28 pb-4 md:px-8 md:pt-32 md:pb-8">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <header className="glass-header fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl px-4 py-3 md:w-[calc(100%-4rem)] md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-28 pb-4 md:px-8 md:pt-32 md:pb-8">
          <Alert variant="destructive" className="glass-card">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex flex-col gap-4">
              <span>エラーが発生しました: {error.message}</span>
              <Button onClick={refetch} variant="outline" size="sm" className="w-fit">
                <RefreshCw className="size-4" />
                再読み込み
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen">
        <header className="glass-header fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl px-4 py-3 md:w-[calc(100%-4rem)] md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-28 pb-4 md:px-8 md:pt-32 md:pb-8">
          <Alert className="glass-card">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex flex-col gap-4">
              <span>データがありません</span>
              <Button onClick={refetch} variant="outline" size="sm" className="w-fit">
                <RefreshCw className="size-4" />
                再読み込み
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-header fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl px-4 py-3 md:w-[calc(100%-4rem)] md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
          </div>
          {selectableMonths.length > 0 && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <PlusCircle className="size-4" />
              記録する
            </Button>
          )}
        </div>
      </header>

      {/* Transaction Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>家計簿を記録</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
            <BulkTransactionForm
              expenseCategories={data.expenseCategories || data.categories}
              incomeCategories={data.incomeCategories || []}
              selectableMonths={selectableMonths}
              onSubmit={async (inputs, balanceInput) => {
                if (inputs.length > 0) {
                  await handleAddTransactions(inputs);
                }
                await updateBalance(balanceInput);
                refetch();
                setShowForm(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-4 md:px-8 md:pt-32 md:pb-8">
        {/* View Mode Switch - iOS style */}
        <div className="flex justify-start mb-6">
          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </div>

        {/* KPI Summary Panel */}
        <div className="mb-6">
          <KPISummaryPanel
            data={viewMode === 'monthly' ? data.monthlyData : data.yearlyData.map(y => ({
              month: `${y.year}-01` as MonthString,
              income: y.income,
              expense: y.expense,
              profit: y.profit,
              totalAssets: y.totalAssets,
              categoryExpense: y.categoryExpense,
            }))}
            viewMode={viewMode}
          />
        </div>

        {/* Charts */}
        <div className="flex flex-col gap-6 animate-fade-in">
          <TotalAssetsChart
            data={displayData.chartData}
            isMonthly={viewMode === 'monthly'}
          />
          <IncomeExpenseChart
            data={displayData.chartData}
            isMonthly={viewMode === 'monthly'}
          />
          <CategoryExpenseChart
            data={displayData.chartData}
            categories={displayData.categories}
            isMonthly={viewMode === 'monthly'}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
