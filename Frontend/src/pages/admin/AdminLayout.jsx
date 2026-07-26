import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/brands', label: 'Brands' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/users', label: 'Users' },
]

export default function AdminLayout() {
  return (
    <div className="admin-shell container">
      <aside className="admin-sidebar">
        <span className="eyebrow">Admin</span>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}
