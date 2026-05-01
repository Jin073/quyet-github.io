import { ASSET_TYPES, INVESTMENT_TYPES } from './constants.js';
import { monthKey } from './formatters.js';

export function transactionTotals(transactions) {
  return transactions.reduce(
    (totals, item) => {
      totals[item.type === 'income' ? 'income' : 'expense'] += Number(item.amount) || 0;
      totals.balance = totals.income - totals.expense;
      return totals;
    },
    { income: 0, expense: 0, balance: 0 },
  );
}

export function filterTransactions(transactions, categories, filters, globalSearch = '') {
  const global = globalSearch.trim().toLowerCase();
  return transactions
    .filter((item) => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && item.categoryId !== filters.category) return false;
      if (filters.from && item.date < filters.from) return false;
      if (filters.to && item.date > filters.to) return false;
      if (filters.search && !item.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (!global) return true;
      const category = categories.find((cat) => cat.id === item.categoryId);
      return `${item.description} ${category?.name || ''} ${item.amount}`.toLowerCase().includes(global);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function monthlyTotals(transactions, monthsBack = 6) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      income: 0,
      expense: 0,
    };
  });

  transactions.forEach((item) => {
    const bucket = months.find((entry) => entry.key === monthKey(item.date));
    if (bucket) bucket[item.type === 'income' ? 'income' : 'expense'] += Number(item.amount) || 0;
  });

  return months;
}

export function categoryBreakdown(transactions, categories, type = 'expense') {
  const totals = new Map();
  transactions.forEach((item) => {
    if (item.type === type) totals.set(item.categoryId, (totals.get(item.categoryId) || 0) + Number(item.amount || 0));
  });
  return [...totals.entries()]
    .map(([categoryId, value]) => {
      const category = categories.find((item) => item.id === categoryId);
      return category ? { id: categoryId, name: category.name, color: category.color, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);
}

export function assetTotals(assets) {
  const total = assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const liquid = assets
    .filter((item) => ASSET_TYPES[item.type]?.liquid)
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
  const byType = groupByType(assets, ASSET_TYPES, 'value');
  return { total, liquid, byType };
}

export function investmentTotals(investments) {
  const current = investments.reduce((sum, item) => sum + Number(item.current || 0), 0);
  const invested = investments.reduce((sum, item) => sum + Number(item.initial || 0), 0);
  const profitLoss = current - invested;
  const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const byType = groupByType(investments, INVESTMENT_TYPES, 'current');
  return { current, invested, profitLoss, profitLossPct, byType };
}

export function groupByType(items, metadata, valueKey) {
  const totals = new Map();
  items.forEach((item) => totals.set(item.type, (totals.get(item.type) || 0) + Number(item[valueKey] || 0)));
  return [...totals.entries()]
    .map(([type, value]) => ({
      type,
      value,
      name: metadata[type]?.label || type,
      color: metadata[type]?.color || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);
}

export function growthStats(snapshots) {
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length < 2) {
    return { avgGrowth: 0, cagr: null, projection12: 0, best: null, worst: null, deltas: [] };
  }

  const deltas = sorted.slice(1).map((snapshot, index) => {
    const previous = sorted[index].assets + sorted[index].investments;
    const current = snapshot.assets + snapshot.investments;
    const deltaAbs = current - previous;
    const deltaPct = previous > 0 ? (deltaAbs / previous) * 100 : 0;
    return { month: snapshot.month, current, previous, deltaAbs, deltaPct };
  });

  const avgGrowth = deltas.reduce((sum, item) => sum + item.deltaPct, 0) / deltas.length;
  const first = sorted[0].assets + sorted[0].investments;
  const last = sorted.at(-1).assets + sorted.at(-1).investments;
  const cagr = first > 0 && last > 0 ? (Math.pow(last / first, 12 / (sorted.length - 1)) - 1) * 100 : null;
  const best = deltas.reduce((winner, item) => (item.deltaPct > winner.deltaPct ? item : winner), deltas[0]);
  const worst = deltas.reduce((winner, item) => (item.deltaPct < winner.deltaPct ? item : winner), deltas[0]);

  return {
    avgGrowth,
    cagr,
    projection12: last * Math.pow(1 + avgGrowth / 100, 12),
    best,
    worst,
    deltas,
  };
}
