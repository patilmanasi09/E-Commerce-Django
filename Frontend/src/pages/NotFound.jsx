import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty-state">
        <div className="empty-state__mark">404</div>
        <p className="empty-state__title">This shelf is empty</p>
        <p className="empty-state__hint">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn--ghost">Back home</Link>
      </div>
    </div>
  )
}
