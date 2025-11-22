import { Currency } from '../types';

// Mock exchange rates relative to USD (Base)
// In a real app, fetch these from an API
const RATES: Record<Currency, number> = {
  [Currency.USD]: 1,
  [Currency.EUR]: 0.92,
  [Currency.INR]: 83.5,
  [Currency.DKK]: 6.85,
  [Currency.NOK]: 10.65,
};

export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  if (from === to) return amount;
  const amountInUsd = amount / RATES[from];
  return amountInUsd * RATES[to];
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getSymbol = (currency: Currency): string => {
    return (0).toLocaleString(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
}
