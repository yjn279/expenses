import { useState, useMemo } from 'react';
import { useHouseholdData } from './hooks/useHouseholdData';
import { addTransactions, updateBalance } from './api/household';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { BulkTransactionForm } from './components/BulkTransactionForm';
import { normalizeMonth } from './utils/month';
import type { ViewMode, TransactionInput, MonthString } from './types';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, RefreshCw, AlertCircle, Wallet } from 'lucide-react';

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
      <div className="min-h-screen bg-background">
        <header className="glass-header sticky top-0 z-50 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
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
      <div className="min-h-screen bg-background">
        <header className="glass-header sticky top-0 z-50 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
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
      <div className="min-h-screen bg-background">
        <header className="glass-header sticky top-0 z-50 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">家計簿ダッシュボード</h1>
          </div>
          {selectableMonths.length > 0 && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <PlusCircle className="size-4" />
              入力
            </Button>
          )}
        </div>
      </header>

      {/* Transaction Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>取引を追加</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* View Toggle Tabs */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          className="mb-8"
        >
          <TabsList className="mx-auto">
            <TabsTrigger value="monthly" className="px-6">
              月別
            </TabsTrigger>
            <TabsTrigger value="yearly" className="px-6">
              年別
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            <div className="flex flex-col gap-6">
              <TotalAssetsChart
                data={displayData.chartData}
                isMonthly={true}
              />
              <IncomeExpenseChart
                data={displayData.chartData}
                isMonthly={true}
              />
              <CategoryExpenseChart
                data={displayData.chartData}
                categories={displayData.categories}
                isMonthly={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-6">
            <div className="flex flex-col gap-6">
              <TotalAssetsChart
                data={displayData.chartData}
                isMonthly={false}
              />
              <IncomeExpenseChart
                data={displayData.chartData}
                isMonthly={false}
              />
              <CategoryExpenseChart
                data={displayData.chartData}
                categories={displayData.categories}
                isMonthly={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
