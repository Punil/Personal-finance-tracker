export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  INR = 'INR',
  DKK = 'DKK',
  NOK = 'NOK'
}

export enum Category {
  Food = 'Food & Drink',
  Transport = 'Transport',
  Shopping = 'Shopping',
  Entertainment = 'Entertainment',
  Bills = 'Bills & Utilities',
  Health = 'Health',
  Travel = 'Travel',
  Other = 'Other'
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  amountInBase: number; // Amount converted to base currency (USD) for aggregation
  category: Category;
  description: string;
  date: string; // ISO Date string YYYY-MM-DD
  timestamp: number;
}

export type ViewState = 'dashboard' | 'analytics' | 'add' | 'history' | 'assistant';

export interface CurrencyRate {
  [key: string]: number;
}
