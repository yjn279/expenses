import { useState, useMemo, useEffect, type FormEvent } from 'react';
import type { TransactionInput, MonthString, BalanceInput } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';

interface BulkTransactionFormProps {
  expenseCategories: string[];
  incomeCategories: string[];
  selectableMonths: MonthString[];
  onSubmit: (inputs: TransactionInput[], balance: BalanceInput) => Promise<void>;
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

function validateAmount(
  amountStr: string,
  fieldName: string
): { isValid: boolean; error: string | null; amount: number | null } {
  if (!amountStr || amountStr === '') {
    return { isValid: false, error: `${fieldName}を入力してください`, amount: null };
  }

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) {
    return { isValid: false, error: `${fieldName}は数値で入力してください`, amount: null };
  }

  if (amount < 0) {
    return { isValid: false, error: `${fieldName}は0円以上で入力してください`, amount: null };
  }

  if (amount > MAX_AMOUNT) {
    return { isValid: false, error: `${fieldName}は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`, amount: null };
  }

  return { isValid: true, error: null, amount };
}

function createInitialAmounts(categories: string[]): Record<string, string> {
  const amounts: Record<string, string> = {};
  for (const cat of categories) {
    amounts[cat] = '0';
  }
  return amounts;
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
  
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>(() =>
    createInitialAmounts(expenseCategories)
  );
  const [incomeAmounts, setIncomeAmounts] = useState<Record<string, string>>(() =>
    createInitialAmounts(incomeCategories)
  );
  const [balance, setBalance] = useState<string>('0');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    setExpenseAmounts((prev) => {
      const updated = createInitialAmounts(expenseCategories);
      for (const cat of expenseCategories) {
        if (prev[cat] !== undefined) {
          updated[cat] = prev[cat];
        }
      }
      return updated;
    });
  }, [expenseCategories]);
  
  useEffect(() => {
    setIncomeAmounts((prev) => {
      const updated = createInitialAmounts(incomeCategories);
      for (const cat of incomeCategories) {
        if (prev[cat] !== undefined) {
          updated[cat] = prev[cat];
        }
      }
      return updated;
    });
  }, [incomeCategories]);

  const handleExpenseChange = (category: string, value: string) => {
    setExpenseAmounts((prev) => ({ ...prev, [category]: value }));
  };

  const handleIncomeChange = (category: string, value: string) => {
    setIncomeAmounts((prev) => ({ ...prev, [category]: value }));
  };

  const filledCount = useMemo(() => {
    const countValid = (amounts: Record<string, string>): number => {
      return Object.values(amounts).filter(
        (v) => v !== undefined && v !== '' && parseInt(v, 10) >= 0
      ).length;
    };
    return countValid(expenseAmounts) + countValid(incomeAmounts);
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

        const validation = validateAmount(amounts[category], category);
        if (!validation.isValid) {
          setError(validation.error!);
          return false;
        }

        transactions.push({
          month: validMonth,
          category,
          type,
          amount: validation.amount!,
        });
      }
      return true;
    }

    if (!processCategories(expenseCategories, expenseAmounts, 'expense')) {
      return;
    }

    if (!processCategories(incomeCategories, incomeAmounts, 'income')) {
      return;
    }

    const balanceValidation = validateAmount(balance, '残高');
    if (!balanceValidation.isValid) {
      setError(balanceValidation.error!);
      return;
    }

    const balanceInput: BalanceInput = {
      month: validMonth,
      balance: balanceValidation.amount!,
    };

    setSubmitting(true);
    try {
      await onSubmit(transactions, balanceInput);
      setSuccess(true);
      setExpenseAmounts(createInitialAmounts(expenseCategories));
      setIncomeAmounts(createInitialAmounts(incomeCategories));
      setBalance('0');
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

      <div className="form-row">
        <label htmlFor="bulk-balance">残高</label>
        <input
          id="bulk-balance"
          type="number"
          min="0"
          max={MAX_AMOUNT}
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
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
                    value={expenseAmounts[category] || '0'}
                    onChange={handleExpenseChange}
                    required
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
                    value={incomeAmounts[category] || '0'}
                    onChange={handleIncomeChange}
                    required
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
