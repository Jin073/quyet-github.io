import { Plus } from 'lucide-react';
import { currentMonthKey, formatMoney } from '../../lib/formatters.js';

export function CategoriesView({ data, currency, onAdd, onEdit, onDelete }) {
  const month = currentMonthKey();

  function spent(categoryId) {
    return data.transactions
      .filter((item) => item.type === 'expense' && item.categoryId === categoryId && item.date.startsWith(month))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  return (
    <>
      <div className="toolbar">
        <div className="filters muted">Manage and customize your spending categories.</div>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={16} />New Category</button>
      </div>
      <div className="cat-grid">
        {data.categories.map((category) => {
          const used = spent(category.id);
          const over = category.budget > 0 && used > category.budget;
          return (
            <article className="cat-card" key={category.id}>
              <div className="cat-color" style={{ background: category.color }}>{category.name.slice(0, 1)}</div>
              <div className="cat-info">
                <div className="cat-name">
                  {category.name} {over && <span className="pill warn">Over</span>}
                </div>
                <div className="cat-meta">
                  {category.type === 'both' ? 'Income & Expense' : category.type}
                  {category.budget > 0 ? ` · ${formatMoney(used, currency)} / ${formatMoney(category.budget, currency)}` : ''}
                </div>
              </div>
              <div className="row-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(category)}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(category)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
