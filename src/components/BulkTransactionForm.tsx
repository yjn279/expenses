import { useState, useEffect, type FormEvent } from 'react';
import type { TransactionInput, MonthString, BalanceInput } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!month || !selectableMonths.includes(month)) {
      setError('有効な月を選択してください');
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Month and Balance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bulk-month">月</Label>
          <Select
            value={month}
            onValueChange={(value) => {
              if (isValidMonthString(value, selectableMonths)) {
                setMonth(value);
              }
            }}
          >
            <SelectTrigger id="bulk-month" className="w-full">
              <SelectValue placeholder="月を選択" />
            </SelectTrigger>
            <SelectContent>
              {selectableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-balance" className="flex items-center gap-1.5">
            <Wallet className="size-3.5" />
            残高
          </Label>
          <div className="relative">
            <Input
              id="bulk-balance"
              type="number"
              min="0"
              max={MAX_AMOUNT}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="pr-8"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              円
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {!hasCategories ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            カテゴリがありません。P/Lシートにデータを追加してください。
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Expense Categories */}
          {expenseCategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingDown className="size-4 text-destructive" />
                支出
              </h4>
              <div className="space-y-2">
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

          {/* Income Categories */}
          {incomeCategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="size-4 text-emerald-600" />
                収入
              </h4>
              <div className="space-y-2">
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
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="success">
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            家計簿を記録しました
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !hasCategories}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            記録中...
          </>
        ) : (
          '記録する'
        )}
      </Button>
    </form>
  );
}
