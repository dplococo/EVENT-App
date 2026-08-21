export default function TablePill({ label, active, onClick, tone = 'neutral' }) {
  return (
    <button className={`table-pill ${active ? 'active' : ''} tone-${tone}`} onClick={onClick} type="button">
      {label}
    </button>
  )
}
