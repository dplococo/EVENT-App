export default function MetricCard({ label, value, accent = 'primary', hint }) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  )
}
