export function StatCard({ label, value, meta, icon: Icon, tone = 'balance', valueClass = '' }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${valueClass}`}>{value}</div>
      <div className="stat-meta">{meta}</div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={20} />
        </div>
      )}
    </article>
  );
}
