import { useState, useMemo } from 'react';
import './App.css';
import { useHouseholdData } from './hooks/useHouseholdData';
import { addTransactions, updateBalance } from './api/household';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { BulkTransactionForm } from './components/BulkTransactionForm';
import { normalizeMonth } from './utils/month';
import type { ViewMode, TransactionInput, MonthString, BalanceInput } from './types';

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

  // Calculate selectable months: months from startMonth to (current date - 2 months)
  // that are not already present in monthlyData
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
    if (!startMonth) {
      return [];
    }

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

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>家計簿ダッシュボード</h1>
        </header>
        <main className="app-main">
          <div className="loading">データを読み込み中...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>家計簿ダッシュボード</h1>
        </header>
        <main className="app-main">
          <div className="error">
            <p>エラーが発生しました</p>
            <p className="error-message">{error.message}</p>
            <button onClick={refetch} className="btn-retry">
              再読み込み
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>家計簿ダッシュボード</h1>
        </header>
        <main className="app-main">
          <div className="error">
            <p>データがありません</p>
            <button onClick={refetch} className="btn-retry">
              再読み込み
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>家計簿ダッシュボード</h1>
        {selectableMonths.length > 0 && (
          <div className="header-actions">
            <button onClick={() => setShowForm(true)} className="btn-input">
              入力
            </button>
          </div>
        )}
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForm(false)}>
              ×
            </button>
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
        </div>
      )}

      <main className="app-main">

        <section className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            月別
          </button>
          <button
            className={`toggle-btn ${viewMode === 'yearly' ? 'active' : ''}`}
            onClick={() => setViewMode('yearly')}
          >
            年別
          </button>
        </section>

        <section className="charts-section">
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
        </section>
      </main>
    </div>
  );
}

export default App;
