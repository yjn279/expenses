import { useState, useMemo, type FormEvent } from 'react';
import type { TransactionInput } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';

interface BulkTransactionFormProps {
  expenseCategories: string[];
  incomeCategories: string[];
  onSubmit: (inputs: TransactionInput[]) => Promise<void>;
}

const MAX_AMOUNT = 1_000_000_000; // 10億

// Get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Validate month is not in the future
function isValidMonth(month: string): boolean {
  const current = getCurrentMonth();
  return month <= current;
}

export function BulkTransactionForm({
  expenseCategories,
  incomeCategories,
  onSubmit,
}: BulkTransactionFormProps) {
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>({});
  const [incomeAmounts, setIncomeAmounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleExpenseChange = (category: string, value: string) => {
    setExpenseAmounts((prev) => ({ ...prev, [category]: value }));
  };

  const handleIncomeChange = (category: string, value: string) => {
    setIncomeAmounts((prev) => ({ ...prev, [category]: value }));
  };

  // Count how many fields have values
  const filledCount = useMemo(() => {
    const expenseFilled = Object.values(expenseAmounts).filter(
      (v) => v && parseInt(v, 10) > 0
    ).length;
    const incomeFilled = Object.values(incomeAmounts).filter(
      (v) => v && parseInt(v, 10) > 0
    ).length;
    return expenseFilled + incomeFilled;
  }, [expenseAmounts, incomeAmounts]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!month || !isValidMonth(month)) {
      setError('有効な月を選択してください（未来の月は選択できません）');
      return;
    }

    // Build transactions array
    const transactions: TransactionInput[] = [];

    // Add expense transactions
    for (const category of expenseCategories) {
      const amountStr = expenseAmounts[category];
      if (amountStr) {
        const amount = parseInt(amountStr, 10);
        if (amount > 0) {
          if (amount > MAX_AMOUNT) {
            setError(
              `${category}の金額は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`
            );
            return;
          }
          transactions.push({ month, category, type: 'expense', amount });
        }
      }
    }

    // Add income transactions
    for (const category of incomeCategories) {
      const amountStr = incomeAmounts[category];
      if (amountStr) {
        const amount = parseInt(amountStr, 10);
        if (amount > 0) {
          if (amount > MAX_AMOUNT) {
            setError(
              `${category}の金額は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`
            );
            return;
          }
          transactions.push({ month, category, type: 'income', amount });
        }
      }
    }

    if (transactions.length === 0) {
      setError('少なくとも1つの金額を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(transactions);
      setSuccess(true);
      // Clear all amounts
      setExpenseAmounts({});
      setIncomeAmounts({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const hasCategories =
    expenseCategories.length > 0 || incomeCategories.length > 0;

  return (
    <form className="bulk-transaction-form" onSubmit={handleSubmit}>
      <h3>取引を追加</h3>

      <div className="form-row">
        <label htmlFor="bulk-month">月</label>
        <input
          id="bulk-month"
          type="month"
          value={month}
          max={getCurrentMonth()}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>

      {!hasCategories ? (
        <div className="no-categories-message">
          カテゴリがありません。P/Lシートにデータを追加してください。
        </div>
      ) : (
        <>
          {expenseCategories.length > 0 && (
            <div className="category-section">
              <h4>支出</h4>
              <div className="category-list">
                {expenseCategories.map((category) => (
                  <CategoryAmountInput
                    key={`expense-${category}`}
                    category={category}
                    value={expenseAmounts[category] || ''}
                    onChange={handleExpenseChange}
                  />
                ))}
              </div>
            </div>
          )}

          {incomeCategories.length > 0 && (
            <div className="category-section">
              <h4>収入</h4>
              <div className="category-list">
                {incomeCategories.map((category) => (
                  <CategoryAmountInput
                    key={`income-${category}`}
                    category={category}
                    value={incomeAmounts[category] || ''}
                    onChange={handleIncomeChange}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="form-error">{error}</div>}
      {success && (
        <div className="form-success">{filledCount}件の取引を追加しました</div>
      )}

      <button
        type="submit"
        className="btn-submit"
        disabled={submitting || !hasCategories}
      >
        {submitting
          ? '追加中...'
          : filledCount > 0
            ? `まとめて追加（${filledCount}件）`
            : 'まとめて追加'}
      </button>
    </form>
  );
}
