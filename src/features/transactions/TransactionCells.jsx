import { formatMoney } from '../../lib/formatters.js';

function Category({ item, categories }) {
  const category = categories.find((entry) => entry.id === item.categoryId);
  return (
    <span className="pill cat">
      <span className="pill-dot" style={{ background: category?.color || '#94a3b8' }} />
      {category?.name || 'Uncategorized'}
    </span>
  );
}

function Type({ item }) {
  return <span className={`pill ${item.type}`}>{item.type === 'income' ? 'Income' : 'Expense'}</span>;
}

function Amount({ item, currency }) {
  const sign = item.type === 'income' ? '+' : '-';
  return <span className={`amount-cell ${item.type}`}>{sign} {formatMoney(item.amount, currency)}</span>;
}

export const TransactionCells = { Category, Type, Amount };
