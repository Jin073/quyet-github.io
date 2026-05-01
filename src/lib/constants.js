export const STORAGE_KEY = 'finova_state_v2';

export const ACCENTS = ['indigo', 'emerald', 'rose', 'amber'];

export const SWATCHES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#64748b', '#78716c',
];

export const ASSET_TYPES = {
  cash: { label: 'Cash', color: '#22c55e', liquid: true },
  bank: { label: 'Bank Account', color: '#3b82f6', liquid: true },
  savings: { label: 'Savings', color: '#10b981', liquid: true },
  gold: { label: 'Gold', color: '#f59e0b', liquid: false },
  real_estate: { label: 'Real Estate', color: '#8b5cf6', liquid: false },
  other: { label: 'Other', color: '#64748b', liquid: false },
};

export const INVESTMENT_TYPES = {
  stocks: { label: 'Stocks', color: '#3b82f6' },
  crypto: { label: 'Crypto', color: '#f59e0b' },
  funds: { label: 'Funds', color: '#10b981' },
  bonds: { label: 'Bonds', color: '#8b5cf6' },
  real_estate: { label: 'Real Estate', color: '#ec4899' },
  other: { label: 'Other', color: '#64748b' },
};

export const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Food & Dining', type: 'expense', color: '#f97316', budget: 0 },
  { id: 'cat_2', name: 'Transport', type: 'expense', color: '#0ea5e9', budget: 0 },
  { id: 'cat_3', name: 'Housing', type: 'expense', color: '#8b5cf6', budget: 0 },
  { id: 'cat_4', name: 'Entertainment', type: 'expense', color: '#ec4899', budget: 0 },
  { id: 'cat_5', name: 'Shopping', type: 'expense', color: '#f43f5e', budget: 0 },
  { id: 'cat_6', name: 'Healthcare', type: 'expense', color: '#14b8a6', budget: 0 },
  { id: 'cat_7', name: 'Utilities', type: 'expense', color: '#64748b', budget: 0 },
  { id: 'cat_8', name: 'Education', type: 'expense', color: '#eab308', budget: 0 },
  { id: 'cat_9', name: 'Salary', type: 'income', color: '#10b981', budget: 0 },
  { id: 'cat_10', name: 'Freelance', type: 'income', color: '#22c55e', budget: 0 },
  { id: 'cat_11', name: 'Investments', type: 'income', color: '#06b6d4', budget: 0 },
  { id: 'cat_12', name: 'Other', type: 'both', color: '#78716c', budget: 0 },
];

export const INITIAL_STATE = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  assets: [],
  investments: [],
  snapshots: [],
  settings: { theme: 'light', accent: 'indigo', currency: '$' },
};
