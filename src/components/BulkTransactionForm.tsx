import { useState, useMemo, type FormEvent } from 'react';
import type { TransactionInput } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';

interface BulkTransactionFormProps {
  expenseCategories: string[];
  incomeCategories: string[];
  selectableMonths: string[];
  onSubmit: (inputs: TransactionInput[]) => Promise<void>;
}

const MAX_AMOUNT = 1_000_000_000; // 10億

export function BulkTransactionForm({
  expenseCategories,
  incomeCategories,
  selectableMonths,
  onSubmit,
}: BulkTransactionFormProps) {
  const [month, setMonth] = useState<string>(selectableMonths[0] || '');
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
    if (!month || !selectableMonths.includes(month)) {
      setError('有効な月を選択してください');
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
        <select
          id="bulk-month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        >
          {selectableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
