import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { TransactionInput } from '../types';

interface TransactionFormProps {
  categories: string[];
  onSubmit: (input: TransactionInput) => Promise<void>;
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

export function TransactionForm({ categories, onSubmit }: TransactionFormProps) {
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [newCategory, setNewCategory] = useState<string>('');
  const [useNewCategory, setUseNewCategory] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!month || !isValidMonth(month)) {
      setError('有効な月を選択してください（未来の月は選択できません）');
      return;
    }

    const selectedCategory = useNewCategory ? newCategory.trim() : category;
    if (!selectedCategory) {
      setError('カテゴリを選択または入力してください');
      return;
    }

    const amountNumber = parseInt(amount, 10);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('金額は正の整数を入力してください');
      return;
    }

    if (amountNumber > MAX_AMOUNT) {
      setError(`金額は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`);
      return;
    }

    const input: TransactionInput = {
      month,
      category: selectedCategory,
      type,
      amount: amountNumber,
    };

    setSubmitting(true);
    try {
      await onSubmit(input);
      setSuccess(true);
      setAmount('');
      if (useNewCategory) {
        setNewCategory('');
        setUseNewCategory(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h3>取引を追加</h3>

      <div className="form-row">
        <label htmlFor="month">月</label>
        <input
          id="month"
          type="month"
          value={month}
          max={getCurrentMonth()}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>種別</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={() => setType('expense')}
            />
            支出
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={() => setType('income')}
            />
            収入
          </label>
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="category">カテゴリ</label>
        <div className="category-input">
          {!useNewCategory ? (
            <>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-link"
                onClick={() => setUseNewCategory(true)}
              >
                新規カテゴリ
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="新しいカテゴリ名"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-link"
                onClick={() => setUseNewCategory(false)}
              >
                既存から選択
              </button>
            </>
          )}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="amount">金額</label>
        <div className="amount-input">
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            required
          />
          <span className="currency">円</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">取引を追加しました</div>}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? '追加中...' : '追加'}
      </button>
    </form>
  );
}
