import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { DonutChart } from '../../components/charts/DonutChart.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { INVESTMENT_TYPES } from '../../lib/constants.js';
import { investmentTotals } from '../../lib/finance.js';
import { formatDate, formatMoney } from '../../lib/formatters.js';

export function InvestmentsView({ data, currency, onAdd, onEdit, onDelete }) {
  const totals = investmentTotals(data.investments);

  return (
    <>
      <div className="summary-grid">
        <StatCard label="Portfolio Value" value={formatMoney(totals.current, currency)} meta={`${data.investments.length} holdings`} icon={TrendingUp} tone="balance" />
        <StatCard label="Total Invested" value={formatMoney(totals.invested, currency)} meta="Initial cost basis" icon={DollarSign} tone="income" />
        <StatCard
          label="Profit / Loss"
          value={formatMoney(totals.profitLoss, currency)}
          meta={`${totals.profitLossPct >= 0 ? '+' : ''}${totals.profitLossPct.toFixed(2)}%`}
          icon={TrendingUp}
          tone="savings"
          valueClass={totals.profitLoss >= 0 ? 'trend-up' : 'trend-down'}
        />
      </div>
      <div className="charts-grid">
        <Panel title="Holdings" subtitle="Stocks, crypto, funds and more" action={<button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14} />Add Investment</button>}>
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (item) => <strong>{item.name}</strong> },
              { key: 'type', label: 'Type', render: (item) => <span className="pill cat"><span className="pill-dot" style={{ background: INVESTMENT_TYPES[item.type]?.color }} />{INVESTMENT_TYPES[item.type]?.label}</span> },
              { key: 'date', label: 'Date', render: (item) => <span className="muted">{formatDate(item.date)}</span> },
              { key: 'initial', label: 'Invested', align: 'right', render: (item) => formatMoney(item.initial, currency) },
              { key: 'current', label: 'Current', align: 'right', render: (item) => formatMoney(item.current, currency) },
              { key: 'pl', label: 'P/L', align: 'right', render: (item) => {
                const pl = item.current - item.initial;
                return <span className={`amount-cell ${pl >= 0 ? 'income' : 'expense'}`}>{formatMoney(pl, currency)}</span>;
              } },
            ]}
            rows={[...data.investments].sort((a, b) => b.current - a.current)}
            empty="No investments yet."
            getKey={(item) => item.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Panel>
        <Panel title="By Type" subtitle="Portfolio mix">
          <DonutChart data={totals.byType} currency={currency} empty="No investments" />
        </Panel>
      </div>
    </>
  );
}
