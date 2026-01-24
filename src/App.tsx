import { useState, useMemo } from 'react';
import './App.css';
import { useHouseholdData } from './hooks/useHouseholdData';
import { addTransaction } from './api/household';
import { TotalAssetsChart } from './components/TotalAssetsChart';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseChart } from './components/CategoryExpenseChart';
import { TransactionForm } from './components/TransactionForm';
import type { ViewMode, TransactionInput, MonthlyData } from './types';

function App() {
  const { data, loading, error, refetch } = useHouseholdData();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

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

  const handleAddTransaction = async (input: TransactionInput): Promise<void> => {
    await addTransaction(input);
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
        <div className="header-actions">
          <button onClick={refetch} className="btn-refresh">
            更新
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="form-section">
          <TransactionForm
            categories={data.categories}
            onSubmit={handleAddTransaction}
          />
        </section>

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
