import { DEFAULT_CATEGORIES } from './constants.js';

function isoDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function createDemoState() {
  const transactions = [
    ['income', 4200, 2, 'cat_9', 'Monthly salary'],
    ['expense', 850, 5, 'cat_3', 'Rent payment'],
    ['expense', 124.5, 1, 'cat_1', 'Grocery store'],
    ['expense', 45, 0, 'cat_2', 'Ride to airport'],
    ['expense', 14.99, 3, 'cat_4', 'Streaming service'],
    ['income', 380, 10, 'cat_10', 'Logo design project'],
    ['expense', 68, 12, 'cat_1', 'Dinner with friends'],
    ['expense', 230, 35, 'cat_5', 'New running shoes'],
    ['income', 4200, 32, 'cat_9', 'Monthly salary'],
  ].map(([type, amount, daysAgo, categoryId, description], index) => ({
    id: `tx_${index + 1}`,
    type,
    amount,
    date: isoDaysAgo(daysAgo),
    categoryId,
    description,
    createdAt: Date.now() - daysAgo * 86400000,
  }));

  const assets = [
    { name: 'Checking Account', type: 'bank', value: 8500, notes: 'Primary account' },
    { name: 'Emergency Fund', type: 'savings', value: 15000, notes: '6 months expenses' },
    { name: 'Cash on hand', type: 'cash', value: 800, notes: '' },
    { name: 'Gold coins', type: 'gold', value: 4200, notes: 'Long-term store' },
    { name: 'Apartment', type: 'real_estate', value: 280000, notes: 'Primary residence' },
  ].map((item, index) => ({ id: `asset_${index + 1}`, createdAt: Date.now(), ...item }));

  const investments = [
    { name: 'Apple Inc.', type: 'stocks', initial: 5000, current: 6750, daysAgo: 420, notes: 'AAPL' },
    { name: 'S&P 500 ETF', type: 'funds', initial: 12000, current: 13680, daysAgo: 540, notes: 'VOO' },
    { name: 'Bitcoin', type: 'crypto', initial: 3000, current: 4250, daysAgo: 300, notes: '' },
    { name: 'Ethereum', type: 'crypto', initial: 2500, current: 1900, daysAgo: 180, notes: '' },
  ].map(({ daysAgo, ...item }, index) => ({
    id: `inv_${index + 1}`,
    createdAt: Date.now() - daysAgo * 86400000,
    date: isoDaysAgo(daysAgo),
    ...item,
  }));

  const snapshots = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const factor = Math.pow(1.016, index);
    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      assets: Math.round(290000 * factor),
      investments: Math.round(30000 * factor * 1.04),
    };
  });

  return {
    transactions,
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    assets,
    investments,
    snapshots,
    settings: { theme: 'light', accent: 'indigo', currency: '$' },
  };
}
