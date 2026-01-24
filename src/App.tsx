import { useState, useMemo } from 'react';
import './App.css';
import { useHouseholdData } from './hooks/useHouseholdData';
import { addTransactions } from './api/household';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { BulkTransactionForm } from './components/BulkTransactionForm';
import { normalizeMonth } from './utils/month';
import type { ViewMode, TransactionInput, MonthlyData } from './types';

function App() {
  const { data, loading, error, refetch } = useHouseholdData();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [showForm, setShowForm] = useState(false);

  // Get last 12 months for monthly view
  const displayData = useMemo(() => {
    if (!data) return { chartData: [], categories: [] };

    if (viewMode === 'monthly') {
      const monthlyData = data.monthlyData.slice(-12);
      return {
        chartData: monthlyData,
        categories: data.categories,
      };
    } else {
      return {
        chartData: data.yearlyData,
        categories: data.categories,
      };
    }
  }, [data, viewMode]);

  // Calculate selectable months (months not in monthlyData, from startMonth to two months ago)
  const selectableMonths = useMemo(() => {
    if (!data) return [];

    // Normalize all months in monthlyData
    const existingMonths = new Set(
      data.monthlyData
        .map((d) => normalizeMonth(d.month))
        .filter((m): m is string => m !== null)
    );
    
    // Normalize startMonth to YYYY-MM format
    let startMonth: string | null = normalizeMonth(data.settings.startMonth);
    
    // Fallback to earliest month in data if startMonth is still invalid
    if (!startMonth && data.monthlyData.length > 0) {
      startMonth = normalizeMonth(data.monthlyData[0].month);
    }
    
    if (!startMonth || !/^\d{4}-\d{2}$/.test(startMonth)) {
      return [];
    }

    // Calculate two months ago
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Generate all months from startMonth to twoMonthsAgo
    const months: string[] = [];
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    let currentYear = startYear;
    let currentMonth = startMonthNum;

    const endYear = twoMonthsAgo.getFullYear();
    const endMonth = twoMonthsAgo.getMonth() + 1;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
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
              onSubmit={async (inputs) => {
                await handleAddTransactions(inputs);
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
            data={displayData.chartData as MonthlyData[]}
            categories={displayData.categories}
            isMonthly={viewMode === 'monthly'}
          />
        </section>

        <section className="summary-section">
          <h3>設定情報</h3>
          <dl className="settings-list">
            <dt>開始月</dt>
            <dd>{data.settings.startMonth}</dd>
            <dt>初期残高</dt>
            <dd>
              {new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                maximumFractionDigits: 0,
              }).format(data.settings.initialBalance)}
            </dd>
          </dl>
        </section>
      </main>

      <footer className="app-footer">
        <p>家計簿ダッシュボード</p>
      </footer>
    </div>
  );
}

export default App;
