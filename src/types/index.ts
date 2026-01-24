// Settings from B/S sheet
export interface Settings {
  initialBalance: number;
  startMonth: string; // YYYY-MM format
}

// Category expense breakdown
export interface CategoryExpense {
  [category: string]: number;
}

// Monthly data entry
export interface MonthlyData {
  month: string; // YYYY-MM format
  income: number;
  expense: number;
  profit: number;
  totalAssets: number;
  categoryExpense: CategoryExpense;
}

// Yearly data entry
export interface YearlyData {
  year: string; // YYYY format
  income: number;
  expense: number;
  profit: number;
  totalAssets: number;
  categoryExpense: CategoryExpense;
}

// Complete data structure from API
export interface HouseholdData {
  settings: Settings;
  monthlyData: MonthlyData[];
  yearlyData: YearlyData[];
  categories: string[];
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Input for adding a new transaction
export interface TransactionInput {
  month: string; // YYYY-MM format
  category: string;
  type: 'income' | 'expense';
  amount: number;
}

// View mode for charts
export type ViewMode = 'monthly' | 'yearly';
