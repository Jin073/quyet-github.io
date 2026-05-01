import { Modal } from '../../components/ui/Modal.jsx';
import { ASSET_TYPES, INVESTMENT_TYPES, SWATCHES } from '../../lib/constants.js';
import { currentMonthKey, todayISO } from '../../lib/formatters.js';

export function EntityForm({ modal, data, onClose, onSave }) {
  const { kind, item = {} } = modal;
  const title = {
    transaction: item.id ? 'Edit Transaction' : 'New Transaction',
    category: item.id ? 'Edit Category' : 'New Category',
    asset: item.id ? 'Edit Asset' : 'New Asset',
    investment: item.id ? 'Edit Investment' : 'New Investment',
    snapshot: item.month ? 'Edit Snapshot' : 'New Snapshot',
  }[kind];

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = Object.fromEntries(form.entries());
    const payload = buildPayload(kind, item, value);
    if (!payload) return;
    onSave(payload.collection, payload.item, payload.prefix);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="modal-body form-grid" onSubmit={submit}>
        {kind === 'transaction' && <TransactionForm item={item} categories={data.categories} />}
        {kind === 'category' && <CategoryForm item={item} />}
        {kind === 'asset' && <AssetForm item={item} />}
        {kind === 'investment' && <InvestmentForm item={item} />}
        {kind === 'snapshot' && <SnapshotForm item={item} />}
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function TransactionForm({ item, categories }) {
  const type = item.type || 'expense';
  const eligible = categories.filter((category) => category.type === 'both' || category.type === type || item.categoryId === category.id);
  return (
    <>
      <input type="hidden" name="id" defaultValue={item.id || ''} />
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Type</span>
          <select name="type" className="form-select" defaultValue={type} required>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="form-row">
          <span className="form-label">Amount</span>
          <input name="amount" className="form-input" type="number" min="0" step="0.01" defaultValue={item.amount || ''} required />
        </label>
      </div>
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Date</span>
          <input name="date" className="form-input" type="date" defaultValue={item.date || todayISO()} required />
        </label>
        <label className="form-row">
          <span className="form-label">Category</span>
          <select name="categoryId" className="form-select" defaultValue={item.categoryId || eligible[0]?.id} required>
            {eligible.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      <label className="form-row">
        <span className="form-label">Description</span>
        <input name="description" className="form-input" maxLength="80" defaultValue={item.description || ''} required />
      </label>
    </>
  );
}

function CategoryForm({ item }) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={item.id || ''} />
      <label className="form-row">
        <span className="form-label">Name</span>
        <input name="name" className="form-input" maxLength="30" defaultValue={item.name || ''} required />
      </label>
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Type</span>
          <select name="type" className="form-select" defaultValue={item.type || 'expense'}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="form-row">
          <span className="form-label">Monthly Budget</span>
          <input name="budget" className="form-input" type="number" min="0" step="0.01" defaultValue={item.budget || ''} />
        </label>
      </div>
      <label className="form-row">
        <span className="form-label">Color</span>
        <select name="color" className="form-select" defaultValue={item.color || SWATCHES[0]}>
          {SWATCHES.map((color) => <option key={color} value={color}>{color}</option>)}
        </select>
      </label>
    </>
  );
}

function AssetForm({ item }) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={item.id || ''} />
      <label className="form-row">
        <span className="form-label">Asset Name</span>
        <input name="name" className="form-input" maxLength="50" defaultValue={item.name || ''} required />
      </label>
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Type</span>
          <select name="type" className="form-select" defaultValue={item.type || 'cash'}>
            {Object.entries(ASSET_TYPES).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </label>
        <label className="form-row">
          <span className="form-label">Current Value</span>
          <input name="value" className="form-input" type="number" min="0" step="0.01" defaultValue={item.value ?? ''} required />
        </label>
      </div>
      <label className="form-row">
        <span className="form-label">Notes</span>
        <input name="notes" className="form-input" maxLength="120" defaultValue={item.notes || ''} />
      </label>
    </>
  );
}

function InvestmentForm({ item }) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={item.id || ''} />
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Name</span>
          <input name="name" className="form-input" maxLength="50" defaultValue={item.name || ''} required />
        </label>
        <label className="form-row">
          <span className="form-label">Type</span>
          <select name="type" className="form-select" defaultValue={item.type || 'stocks'}>
            {Object.entries(INVESTMENT_TYPES).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </label>
      </div>
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Initial Value</span>
          <input name="initial" className="form-input" type="number" min="0" step="0.01" defaultValue={item.initial ?? ''} required />
        </label>
        <label className="form-row">
          <span className="form-label">Current Value</span>
          <input name="current" className="form-input" type="number" min="0" step="0.01" defaultValue={item.current ?? ''} required />
        </label>
      </div>
      <label className="form-row">
        <span className="form-label">Invested Date</span>
        <input name="date" className="form-input" type="date" defaultValue={item.date || todayISO()} required />
      </label>
      <label className="form-row">
        <span className="form-label">Notes</span>
        <input name="notes" className="form-input" maxLength="120" defaultValue={item.notes || ''} />
      </label>
    </>
  );
}

function SnapshotForm({ item }) {
  return (
    <>
      <label className="form-row">
        <span className="form-label">Month</span>
        <input name="month" className="form-input" type="month" defaultValue={item.month || currentMonthKey()} required />
      </label>
      <div className="form-row two">
        <label className="form-row">
          <span className="form-label">Total Assets</span>
          <input name="assets" className="form-input" type="number" min="0" step="0.01" defaultValue={item.assets ?? ''} required />
        </label>
        <label className="form-row">
          <span className="form-label">Total Investments</span>
          <input name="investments" className="form-input" type="number" min="0" step="0.01" defaultValue={item.investments ?? ''} required />
        </label>
      </div>
    </>
  );
}

function buildPayload(kind, original, value) {
  if (kind === 'transaction') {
    return {
      collection: 'transactions',
      prefix: 'tx',
      item: {
        id: value.id || undefined,
        createdAt: original.createdAt || Date.now(),
        type: value.type,
        amount: Number(value.amount),
        date: value.date,
        categoryId: value.categoryId,
        description: value.description.trim(),
      },
    };
  }
  if (kind === 'category') {
    return {
      collection: 'categories',
      prefix: 'cat',
      item: {
        id: value.id || undefined,
        name: value.name.trim(),
        type: value.type,
        budget: Number(value.budget) || 0,
        color: value.color,
      },
    };
  }
  if (kind === 'asset') {
    return {
      collection: 'assets',
      prefix: 'a',
      item: {
        id: value.id || undefined,
        createdAt: original.createdAt || Date.now(),
        name: value.name.trim(),
        type: value.type,
        value: Number(value.value),
        notes: value.notes.trim(),
      },
    };
  }
  if (kind === 'investment') {
    return {
      collection: 'investments',
      prefix: 'inv',
      item: {
        id: value.id || undefined,
        createdAt: original.createdAt || Date.now(),
        name: value.name.trim(),
        type: value.type,
        initial: Number(value.initial),
        current: Number(value.current),
        date: value.date,
        notes: value.notes.trim(),
      },
    };
  }
  if (kind === 'snapshot') {
    return {
      collection: 'snapshots',
      prefix: 'snapshot',
      item: {
        month: value.month,
        assets: Number(value.assets),
        investments: Number(value.investments),
      },
    };
  }
  return null;
}
