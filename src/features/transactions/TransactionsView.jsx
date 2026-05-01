import { Plus } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { formatDate } from '../../lib/formatters.js';
import { TransactionCells } from './TransactionCells.jsx';

export function TransactionsView({ data, currency, filters, setFilters, transactions, onAdd, onEdit, onDelete }) {
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <input className="field" placeholder="Search description..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
          <select className="field" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="field" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input className="field" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
          <input className="field" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', type: '', category: '', from: '', to: '' })}>Clear</button>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={16} />Add</button>
      </div>
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (item) => <span className="muted">{formatDate(item.date)}</span> },
          { key: 'description', label: 'Description', render: (item) => <strong>{item.description}</strong> },
          { key: 'category', label: 'Category', render: (item) => <TransactionCells.Category item={item} categories={data.categories} /> },
          { key: 'type', label: 'Type', render: (item) => <TransactionCells.Type item={item} /> },
          { key: 'amount', label: 'Amount', align: 'right', render: (item) => <TransactionCells.Amount item={item} currency={currency} /> },
        ]}
        rows={transactions}
        empty="No transactions found."
        getKey={(item) => item.id}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
