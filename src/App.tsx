import { useMemo, useState, type ReactNode } from 'react';
import { addTransactions, updateBalance } from './api/household';
import { BulkTransactionForm } from './components/BulkTransactionForm';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { KPISummaryPanel } from './components/KPISummaryPanel';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { useHouseholdData } from './hooks/useHouseholdData';
import type { MonthString, TransactionInput, ViewMode } from './types';
import { normalizeMonth } from './utils/month';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, PlusCircle, RefreshCw, Wallet } from 'lucide-react';

function ViewModeSwitch({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  const options: { value: ViewMode; label: string }[] = [{ value: 'monthly', label: '月別' }, { value: 'yearly', label: '年別' }];
  return (
    <div className="ios-switch">
      <div className="ios-switch-indicator" style={{ left: value === 'monthly' ? '3px' : '50%' }} />
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

function DashboardHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="glass-header fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl px-4 py-3 md:w-[calc(100%-4rem)] md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="size-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">家計簿ダッシュボード</h1>
        </div>
        {action}
      </div>
    </header>
  );
}

function DashboardShell({ action, children }: { action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DashboardHeader action={action} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}

function RetryAlert({ message, onRetry, destructive = false }: { message: string; onRetry: () => void; destructive?: boolean }) {
  return (
    <Alert variant={destructive ? 'destructive' : 'default'} className="glass-card">
      <AlertCircle className="size-4" />
      <AlertDescription className="flex flex-col gap-4">
        <span>{message}</span>
        <Button onClick={onRetry} variant="outline" size="sm" className="w-fit">
          <RefreshCw className="size-4" />
          再読み込み
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function App() {
  const { data, loading, error, refetch } = useHouseholdData();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [showForm, setShowForm] = useState(false);
  const isMonthly = viewMode === 'monthly';

  const displayData = useMemo(() => {
    if (!data) return { chartData: [], categories: [], kpiData: [] };
    if (isMonthly) {
      return { chartData: data.monthlyData.slice(-12), categories: data.categories, kpiData: data.monthlyData };
    }
    return {
      chartData: data.yearlyData,
      categories: data.categories,
      kpiData: data.yearlyData.map((item) => ({
        month: `${item.year}-01` as MonthString,
        income: item.income,
        expense: item.expense,
        profit: item.profit,
        totalAssets: item.totalAssets,
        categoryExpense: item.categoryExpense,
      })),
    };
  }, [data, isMonthly]);

  const selectableMonths = useMemo(() => {
    if (!data) return [];
    const existingMonths = new Set(data.monthlyData.map((d) => normalizeMonth(d.month)).filter((m): m is MonthString => m !== null));
    const startMonth = normalizeMonth(data.settings.startMonth) ?? normalizeMonth(data.monthlyData[0]?.month ?? '');
    if (!startMonth) return [];

    const twoMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1);
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const endYear = twoMonthsAgo.getFullYear();
    const endMonth = twoMonthsAgo.getMonth() + 1;
    const months: MonthString[] = [];
    for (let year = startYear, month = startMonthNum; year < endYear || (year === endYear && month <= endMonth);) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}` as MonthString;
      if (!existingMonths.has(monthStr)) months.push(monthStr);
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return months;
  }, [data]);

  const handleAddTransactions = async (inputs: TransactionInput[]) => {
    await addTransactions(inputs);
    refetch();
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="dashboard-stack">
          <Skeleton className="mx-auto h-9 w-44" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="dashboard-chart-grid">
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[340px] w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (error) return <DashboardShell><RetryAlert message={`エラーが発生しました: ${error.message}`} onRetry={refetch} destructive /></DashboardShell>;
  if (!data) return <DashboardShell><RetryAlert message="データがありません" onRetry={refetch} /></DashboardShell>;

  return (
    <DashboardShell
      action={
        selectableMonths.length > 0 ? (
          <Button onClick={() => setShowForm(true)} size="sm">
            <PlusCircle className="size-4" />
            記録する
          </Button>
        ) : undefined
      }
    >
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>家計簿を記録</DialogTitle>
          </DialogHeader>
          <div className="dialog-scroll-region min-h-0 flex-1 -mx-6 px-6">
            <BulkTransactionForm
              expenseCategories={data.expenseCategories || data.categories}
              incomeCategories={data.incomeCategories || []}
              selectableMonths={selectableMonths}
              onSubmit={async (inputs, balanceInput) => {
                if (inputs.length > 0) await handleAddTransactions(inputs);
                await updateBalance(balanceInput);
                refetch();
                setShowForm(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="dashboard-stack">
        <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        <KPISummaryPanel data={displayData.kpiData} viewMode={viewMode} />
        <div className="dashboard-charts">
          <div className="dashboard-chart-grid">
            <TotalAssetsChart data={displayData.chartData} isMonthly={isMonthly} />
            <IncomeExpenseChart data={displayData.chartData} isMonthly={isMonthly} />
          </div>
          <CategoryExpenseChart data={displayData.chartData} categories={displayData.categories} isMonthly={isMonthly} />
        </div>
      </div>
    </DashboardShell>
  );
}

export default App;
