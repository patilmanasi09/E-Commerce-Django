export default function Loader({ label = 'Loading' }) {
  return (
    <div className="loader">
      <div className="loader__spin" />
      <span>{label}…</span>
    </div>
  )
}
