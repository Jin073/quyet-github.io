import { Building2, Plus, Wallet } from 'lucide-react';
import { DonutChart } from '../../components/charts/DonutChart.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { ASSET_TYPES } from '../../lib/constants.js';
import { assetTotals, investmentTotals } from '../../lib/finance.js';
import { formatMoney } from '../../lib/formatters.js';

export function AssetsView({ data, currency, onAdd, onEdit, onDelete }) {
  const assets = assetTotals(data.assets);
  const investments = investmentTotals(data.investments);

  return (
    <>
      <div className="summary-grid">
        <StatCard label="Total Assets" value={formatMoney(assets.total, currency)} meta={`${data.assets.length} assets tracked`} icon={Building2} tone="balance" />
        <StatCard label="Liquid Assets" value={formatMoney(assets.liquid, currency)} meta="Cash, banks, savings" icon={Wallet} tone="income" />
        <StatCard label="Net Worth" value={formatMoney(assets.total + investments.current, currency)} meta="Assets plus investments" icon={Wallet} tone="savings" />
      </div>
      <div className="charts-grid">
        <Panel title="Your Assets" subtitle="Manage cash, accounts, property and more" action={<button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14} />Add Asset</button>}>
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (item) => <strong>{item.name}</strong> },
              { key: 'type', label: 'Type', render: (item) => <span className="pill cat"><span className="pill-dot" style={{ background: ASSET_TYPES[item.type]?.color }} />{ASSET_TYPES[item.type]?.label}</span> },
              { key: 'notes', label: 'Notes', render: (item) => <span className="muted">{item.notes || '-'}</span> },
              { key: 'value', label: 'Value', align: 'right', render: (item) => <span className="amount-cell">{formatMoney(item.value, currency)}</span> },
            ]}
            rows={[...data.assets].sort((a, b) => b.value - a.value)}
            empty="No assets yet."
            getKey={(item) => item.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Panel>
        <Panel title="Allocation" subtitle="By asset type">
          <DonutChart data={assets.byType} currency={currency} empty="No assets" />
        </Panel>
      </div>
    </>
  );
}
