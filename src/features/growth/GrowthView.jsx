import { Calendar, Plus, TrendingUp } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { growthStats } from '../../lib/finance.js';
import { formatMoney, formatMonth } from '../../lib/formatters.js';

export function GrowthView({ data, currency, onAdd, onEdit, onDelete }) {
  const snapshots = [...data.snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const stats = growthStats(snapshots);

  return (
    <>
      <div className="summary-grid">
        <StatCard label="Months Tracked" value={snapshots.length} meta={snapshots.length ? `${formatMonth(snapshots[0].month)} - ${formatMonth(snapshots.at(-1).month)}` : 'No snapshots yet'} icon={Calendar} tone="balance" />
        <StatCard label="Avg Monthly Growth" value={`${stats.avgGrowth >= 0 ? '+' : ''}${stats.avgGrowth.toFixed(2)}%`} meta="Net worth change" icon={TrendingUp} tone="income" valueClass={stats.avgGrowth >= 0 ? 'trend-up' : 'trend-down'} />
        <StatCard label="CAGR" value={stats.cagr == null ? '-' : `${stats.cagr >= 0 ? '+' : ''}${stats.cagr.toFixed(2)}%`} meta="Annualized return" icon={TrendingUp} tone="savings" />
        <StatCard label="Projection (12 mo)" value={snapshots.length > 1 ? formatMoney(stats.projection12, currency) : '-'} meta="Based on avg growth" icon={TrendingUp} tone="balance" />
      </div>
      <div className="charts-grid">
        <Panel title="Best & Worst Months" subtitle="Net worth growth rate">
          {stats.best ? (
            <div className="metric-list">
              <Metric label="Best Month" item={stats.best} currency={currency} good />
              <Metric label="Worst Month" item={stats.worst} currency={currency} />
            </div>
          ) : (
            <div className="empty-state">Add at least two snapshots.</div>
          )}
        </Panel>
        <Panel title="Monthly Snapshots" subtitle="Edit or backfill past months" action={<button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14} />New Snapshot</button>}>
          <DataTable
            columns={[
              { key: 'month', label: 'Month', render: (item) => <strong>{formatMonth(item.month)}</strong> },
              { key: 'assets', label: 'Assets', align: 'right', render: (item) => formatMoney(item.assets, currency) },
              { key: 'investments', label: 'Investments', align: 'right', render: (item) => formatMoney(item.investments, currency) },
              { key: 'net', label: 'Net Worth', align: 'right', render: (item) => <strong>{formatMoney(item.assets + item.investments, currency)}</strong> },
            ]}
            rows={[...snapshots].reverse()}
            empty="No snapshots yet."
            getKey={(item) => item.month}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Panel>
      </div>
    </>
  );
}

function Metric({ label, item, currency }) {
  return (
    <div className="metric-row">
      <div>
        <div className="stat-label">{label}</div>
        <strong>{formatMonth(item.month)}</strong>
      </div>
      <div className="metric-value">
        <span className={item.deltaPct >= 0 ? 'trend-up' : 'trend-down'}>{item.deltaPct >= 0 ? '+' : ''}{item.deltaPct.toFixed(2)}%</span>
        <small>{formatMoney(item.deltaAbs, currency)}</small>
      </div>
    </div>
  );
}
