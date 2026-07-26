export default function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <div className="empty-state__mark">—</div>
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
    </div>
  )
}
