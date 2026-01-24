import { useState, useMemo, type FormEvent } from 'react';
import type { TransactionInput, MonthString } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';

/**
 * 一括取引入力フォームのプロパティ
 */
interface BulkTransactionFormProps {
  /** 支出カテゴリの配列 */
  expenseCategories: string[];
  /** 収入カテゴリの配列 */
  incomeCategories: string[];
  /** 選択可能な月の配列 */
  selectableMonths: MonthString[];
  /** フォーム送信時のコールバック関数 */
  onSubmit: (inputs: TransactionInput[]) => Promise<void>;
}

const MAX_AMOUNT = 1_000_000_000;
const MIN_CATEGORY_LENGTH = 1;
const MAX_CATEGORY_LENGTH = 50;

function isValidMonthString(
  value: string,
  validMonths: MonthString[]
): value is MonthString {
  return validMonths.includes(value as MonthString);
}

function validateCategory(category: string): string | null {
  if (category.length < MIN_CATEGORY_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return `カテゴリ名「${category}」の長さが無効です（${MIN_CATEGORY_LENGTH}-${MAX_CATEGORY_LENGTH}文字）`;
  }
  return null;
}

export function BulkTransactionForm({
  expenseCategories,
  incomeCategories,
  selectableMonths,
  onSubmit,
}: BulkTransactionFormProps) {
  const [month, setMonth] = useState<MonthString | ''>(
    selectableMonths.length > 0 ? selectableMonths[0] : ''
  );
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

    if (!month || !selectableMonths.includes(month)) {
      setError('有効な月を選択してください');
      return;
    }

    // この時点で month は有効な MonthString であることが保証されている
    const validMonth = month as MonthString;

    const transactions: TransactionInput[] = [];

    function processCategories(
      categories: string[],
      amounts: Record<string, string>,
      type: TransactionInput['type']
    ): boolean {
      for (const category of categories) {
        const categoryError = validateCategory(category);
        if (categoryError) {
          setError(categoryError);
          return false;
        }

        const amountStr = amounts[category];
        if (!amountStr) continue;

        const amount = parseInt(amountStr, 10);
        if (amount <= 0) continue;

        if (amount > MAX_AMOUNT) {
          setError(`${category}の金額は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`);
          return false;
        }

        transactions.push({ month: validMonth, category, type, amount });
      }
      return true;
    }

    if (!processCategories(expenseCategories, expenseAmounts, 'expense')) {
      return;
    }

    if (!processCategories(incomeCategories, incomeAmounts, 'income')) {
      return;
    }

    if (transactions.length === 0) {
      setError('少なくとも1つの金額を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(transactions);
      setSuccess(true);
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
          onChange={(e) => {
            const value = e.target.value;
            if (isValidMonthString(value, selectableMonths)) {
              setMonth(value);
            }
          }}
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

      {error && (
        <div className="form-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {success && (
        <div className="form-success" role="status" aria-live="polite">
          {filledCount}件の取引を追加しました
        </div>
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
