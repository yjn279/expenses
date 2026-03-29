import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2, TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';
import type { BalanceInput, MonthString, TransactionInput } from '../types';
import { CategoryAmountInput } from './CategoryAmountInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface BulkTransactionFormProps {
  expenseCategories: string[];
  incomeCategories: string[];
  selectableMonths: MonthString[];
  onSubmit: (inputs: TransactionInput[], balance: BalanceInput) => Promise<void>;
}

const MAX_AMOUNT = 1_000_000_000;
const MIN_CATEGORY_LENGTH = 1;
const MAX_CATEGORY_LENGTH = 50;
const ZERO = '0';

type AmountMap = Record<string, string>;
type TransactionType = TransactionInput['type'];

interface CategorySection {
  key: TransactionType;
  title: string;
  icon: LucideIcon;
  iconClass: string;
  categories: string[];
  values: AmountMap;
  onChange: (category: string, value: string) => void;
}

function isValidMonthString(value: string, validMonths: MonthString[]): value is MonthString {
  return validMonths.includes(value as MonthString);
}

function createAmountMap(categories: string[], previous: AmountMap = {}): AmountMap {
  return Object.fromEntries(categories.map((category) => [category, previous[category] ?? ZERO]));
}

function validateCategory(category: string): string | null {
  if (category.length < MIN_CATEGORY_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return `カテゴリ名「${category}」の長さが無効です（${MIN_CATEGORY_LENGTH}-${MAX_CATEGORY_LENGTH}文字）`;
  }
  return null;
}

function validateAmount(amountStr: string, fieldName: string): { error: string | null; amount: number | null } {
  if (!amountStr) return { error: `${fieldName}を入力してください`, amount: null };
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) return { error: `${fieldName}は数値で入力してください`, amount: null };
  if (amount < 0) return { error: `${fieldName}は0円以上で入力してください`, amount: null };
  if (amount > MAX_AMOUNT) return { error: `${fieldName}は${MAX_AMOUNT.toLocaleString()}円以下で入力してください`, amount: null };
  return { error: null, amount };
}

function buildTransactions(month: MonthString, categories: string[], amounts: AmountMap, type: TransactionType) {
  const transactions: TransactionInput[] = [];
  for (const category of categories) {
    const categoryError = validateCategory(category);
    if (categoryError) return { error: categoryError, transactions: [] };

    const { error, amount } = validateAmount(amounts[category], category);
    if (error || amount === null) return { error, transactions: [] };
    transactions.push({ month, category, type, amount });
  }
  return { error: null, transactions };
}

export function BulkTransactionForm({
  expenseCategories,
  incomeCategories,
  selectableMonths,
  onSubmit,
}: BulkTransactionFormProps) {
  const [month, setMonth] = useState<MonthString | ''>(selectableMonths[0] ?? '');
  const [expenseAmounts, setExpenseAmounts] = useState<AmountMap>(() => createAmountMap(expenseCategories));
  const [incomeAmounts, setIncomeAmounts] = useState<AmountMap>(() => createAmountMap(incomeCategories));
  const [balance, setBalance] = useState(ZERO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => setExpenseAmounts((previous) => createAmountMap(expenseCategories, previous)), [expenseCategories]);
  useEffect(() => setIncomeAmounts((previous) => createAmountMap(incomeCategories, previous)), [incomeCategories]);

  const setAmount = (setter: React.Dispatch<React.SetStateAction<AmountMap>>) =>
    (category: string, value: string) => setter((previous) => ({ ...previous, [category]: value }));

  const sections = [
    {
      key: 'expense',
      title: '支出',
      icon: TrendingDown,
      iconClass: 'text-destructive',
      categories: expenseCategories,
      values: expenseAmounts,
      onChange: setAmount(setExpenseAmounts),
    } satisfies CategorySection,
    {
      key: 'income',
      title: '収入',
      icon: TrendingUp,
      iconClass: 'text-[hsl(var(--success))]',
      categories: incomeCategories,
      values: incomeAmounts,
      onChange: setAmount(setIncomeAmounts),
    } satisfies CategorySection,
  ].filter((section) => section.categories.length > 0);

  const hasCategories = sections.length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!month || !selectableMonths.includes(month)) return setError('有効な月を選択してください');

    const expenseResult = buildTransactions(month, expenseCategories, expenseAmounts, 'expense');
    if (expenseResult.error) return setError(expenseResult.error);

    const incomeResult = buildTransactions(month, incomeCategories, incomeAmounts, 'income');
    if (incomeResult.error) return setError(incomeResult.error);

    const { error: balanceError, amount: validatedBalance } = validateAmount(balance, '残高');
    if (balanceError || validatedBalance === null) return setError(balanceError);

    setSubmitting(true);
    try {
      await onSubmit([...expenseResult.transactions, ...incomeResult.transactions], { month, balance: validatedBalance });
      setSuccess(true);
      setExpenseAmounts(createAmountMap(expenseCategories));
      setIncomeAmounts(createAmountMap(incomeCategories));
      setBalance(ZERO);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bulk-month">月</Label>
          <Select value={month} onValueChange={(value) => isValidMonthString(value, selectableMonths) && setMonth(value)}>
            <SelectTrigger id="bulk-month" className="w-full">
              <SelectValue placeholder="月を選択" />
            </SelectTrigger>
            <SelectContent>
              {selectableMonths.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
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
              onChange={(event) => setBalance(event.target.value)}
              className="pr-8"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">円</span>
          </div>
        </div>
      </div>

      <Separator />

      {!hasCategories ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>カテゴリがありません。P/Lシートにデータを追加してください。</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sections.map(({ key, title, icon: Icon, iconClass, categories, values, onChange }) => (
            <div key={key} className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className={`size-4 ${iconClass}`} />
                {title}
              </h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <CategoryAmountInput
                    key={`${key}-${category}`}
                    category={category}
                    value={values[category] ?? ZERO}
                    onChange={onChange}
                    required
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle2 className="size-4" />
          <AlertDescription>家計簿を記録しました</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={submitting || !hasCategories}>
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
