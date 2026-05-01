import { Building2, DollarSign, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { BarChart } from '../../components/charts/BarChart.jsx';
import { DonutChart } from '../../components/charts/DonutChart.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { assetTotals, categoryBreakdown, investmentTotals, monthlyTotals, transactionTotals } from '../../lib/finance.js';
import { formatDate, formatMoney } from '../../lib/formatters.js';
import { TransactionCells } from '../transactions/TransactionCells.jsx';

export function DashboardView({ data, currency, goTo }) {
  const totals = transactionTotals(data.transactions);
  const assets = assetTotals(data.assets);
  const investments = investmentTotals(data.investments);
  const savings = totals.income > 0 ? Math.max(0, ((totals.income - totals.expense) / totals.income) * 100) : 0;
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5);

  return (
    <>
      <div className="summary-grid">
        <StatCard label="Total Income" value={formatMoney(totals.income, currency)} meta="All-time inflows" icon={TrendingUp} tone="income" />
        <StatCard label="Total Expenses" value={formatMoney(totals.expense, currency)} meta="All-time outflows" icon={TrendingDown} tone="expense" />
        <StatCard label="Net Balance" value={formatMoney(totals.balance, currency)} meta="Income minus expenses" icon={Wallet} tone="balance" />
        <StatCard label="Savings Rate" value={`${savings.toFixed(0)}%`} meta="Of total income" icon={PiggyBank} tone="savings" />
      </div>

      <div className="summary-grid">
        <StatCard label="Total Assets" value={formatMoney(assets.total, currency)} meta={`${data.assets.length} assets tracked`} icon={Building2} tone="balance" />
        <StatCard label="Total Investments" value={formatMoney(investments.current, currency)} meta={`${data.investments.length} holdings`} icon={TrendingUp} tone="income" />
        <StatCard label="Net Worth" value={formatMoney(assets.total + investments.current, currency)} meta="Assets plus investments" icon={Wallet} tone="balance" />
        <StatCard
          label="Portfolio P/L"
          value={formatMoney(investments.profitLoss, currency)}
          meta={`${investments.profitLossPct >= 0 ? '+' : ''}${investments.profitLossPct.toFixed(2)}% all-time`}
          icon={DollarSign}
          tone="savings"
          valueClass={investments.profitLoss >= 0 ? 'trend-up' : 'trend-down'}
        />
      </div>

      <div className="charts-grid">
        <Panel title="Monthly Trend" subtitle="Income vs expenses over the last 6 months">
          <BarChart data={monthlyTotals(data.transactions, 6)} currency={currency} />
          <div className="inline-legend">
            <span><i className="dot income-dot" />Income</span>
            <span><i className="dot expense-dot" />Expense</span>
          </div>
        </Panel>
        <Panel title="By Category" subtitle="Expense distribution">
          <DonutChart data={categoryBreakdown(data.transactions, data.categories, 'expense')} currency={currency} empty="No expenses" />
        </Panel>
      </div>

      <Panel
        title="Recent Transactions"
        subtitle="Last 5 entries"
        action={<button className="btn btn-ghost btn-sm" onClick={() => goTo('transactions')}>View all</button>}
      >
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: (item) => <span className="muted">{formatDate(item.date)}</span> },
            { key: 'description', label: 'Description', render: (item) => <strong>{item.description}</strong> },
            { key: 'category', label: 'Category', render: (item) => <TransactionCells.Category item={item} categories={data.categories} /> },
            { key: 'type', label: 'Type', render: (item) => <TransactionCells.Type item={item} /> },
            { key: 'amount', label: 'Amount', align: 'right', render: (item) => <TransactionCells.Amount item={item} currency={currency} /> },
          ]}
          rows={recent}
          empty="No transactions yet."
          getKey={(item) => item.id}
        />
      </Panel>
    </>
  );
}
