import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M16 16l4-4-4-4" />
      <path d="M20 12H9" />
    </svg>
  )
}

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__brand" onClick={() => setOpen(false)}>
          <span className="nav__brand-mark">S.</span>
          ShelfStock
        </Link>

        <button className="nav__burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          <NavLink to="/products" onClick={() => setOpen(false)}>Shop</NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)}>Admin</NavLink>
          )}

          {isAuthenticated ? (
            <>
              <NavLink to="/cart" className="nav__cart" onClick={() => setOpen(false)} aria-label="Cart">
                <CartIcon />
                {itemCount > 0 && <span className="nav__cart-badge">{itemCount}</span>}
              </NavLink>

              <NavLink to="/profile" className="nav__profile" onClick={() => setOpen(false)}>
                <span className="nav__avatar">{initial}</span>
                {user?.name?.split(' ')[0] || 'Profile'}
              </NavLink>

              <button className="nav__logout" onClick={handleLogout}>
                <LogoutIcon />
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}>Sign in</NavLink>
              <Link to="/register" className="btn btn--sm" onClick={() => setOpen(false)}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
