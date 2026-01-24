/**
 * YYYY-MM形式の月文字列を表す型
 * 例: "2025-01", "2025-12"
 */
export type MonthString = `${number}-${string}`;

/**
 * B/Sシートから取得する設定情報
 */
export interface Settings {
  /** 初期残高（円） */
  initialBalance: number;
  /** 家計簿の開始月（YYYY-MM形式） */
  startMonth: MonthString;
}

/**
 * カテゴリ別の支出額を表すマップ
 * キーはカテゴリ名、値は支出額（円）
 */
export interface CategoryExpense {
  [category: string]: number;
}

/**
 * 月次データエントリ
 */
export interface MonthlyData {
  /** 月（YYYY-MM形式） */
  month: MonthString;
  /** 収入（円） */
  income: number;
  /** 支出（円） */
  expense: number;
  /** 収支（収入 - 支出、円） */
  profit: number;
  /** 総資産（円） */
  totalAssets: number;
  /** カテゴリ別支出 */
  categoryExpense: CategoryExpense;
}

/**
 * 年次データエントリ
 */
export interface YearlyData {
  /** 年（YYYY形式） */
  year: string;
  /** 収入（円） */
  income: number;
  /** 支出（円） */
  expense: number;
  /** 収支（収入 - 支出、円） */
  profit: number;
  /** 総資産（円） */
  totalAssets: number;
  /** カテゴリ別支出 */
  categoryExpense: CategoryExpense;
}

/**
 * APIから取得する完全な家計データ構造
 */
export interface HouseholdData {
  /** 設定情報 */
  settings: Settings;
  /** 月次データの配列 */
  monthlyData: MonthlyData[];
  /** 年次データの配列 */
  yearlyData: YearlyData[];
  /** 支出カテゴリ一覧（後方互換のため残存、expenseCategoriesと同じ） */
  categories: string[];
  /** 支出カテゴリ一覧 */
  expenseCategories: string[];
  /** 収入カテゴリ一覧 */
  incomeCategories: string[];
}

/**
 * 汎用的なAPIレスポンスのラッパー
 * @template T - レスポンスデータの型
 */
export interface ApiResponse<T> {
  /** リクエストが成功したかどうか */
  success: boolean;
  /** レスポンスデータ（成功時） */
  data?: T;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/**
 * 新しいトランザクションを追加するための入力データ
 */
export interface TransactionInput {
  /** 月（YYYY-MM形式） */
  month: MonthString;
  /** カテゴリ名 */
  category: string;
  /** 取引タイプ（収入または支出） */
  type: 'income' | 'expense';
  /** 金額（円） */
  amount: number;
}

/**
 * バッチでトランザクションを送信するための入力データ
 */
export interface BatchTransactionInput {
  /** トランザクションの配列 */
  transactions: TransactionInput[];
}

/**
 * グラフの表示モード
 */
export type ViewMode = 'monthly' | 'yearly';
