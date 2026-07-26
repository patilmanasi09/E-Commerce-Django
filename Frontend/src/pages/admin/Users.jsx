import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { extractErrorMessage } from '../../utils/helpers'

export default function Users() {
  const { user: currentUser } = useAuth()
  const { notify } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', is_admin: false, is_staff: false, is_active: true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function load() {
    setLoading(true)
    return api.get('/users/all/')
      .then(({ data }) => setUsers(data.users))
      .catch(() => notify('Could not load users — are you signed in as an admin?', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = [...users]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    if (roleFilter === 'admin') list = list.filter((u) => u.is_admin)
    if (roleFilter === 'customer') list = list.filter((u) => !u.is_admin)
    if (roleFilter === 'inactive') list = list.filter((u) => !u.is_active)
    return list
  }, [users, search, roleFilter])

  function openEdit(user) {
    setForm({ name: user.name, email: user.email, is_admin: user.is_admin, is_staff: user.is_staff, is_active: user.is_active })
    setError(null)
    setEditing(user)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await api.patch(`/users/${editing.id}/update/`, form)
      notify('User updated.', 'success')
      setEditing(null)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function quickToggle(user, field) {
    if (user.id === currentUser.id && field === 'is_active') {
      notify("You can't deactivate your own account.", 'error')
      return
    }
    try {
      await api.patch(`/users/${user.id}/update/`, { [field]: !user[field] })
      notify('Updated.', 'success')
      load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.delete(`/users/${deleteTarget.id}/delete/`)
      notify('User deleted.', 'success')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Users</h1>
        <p>{users.length} registered</p>
      </div>

      <div className="filter-bar filter-bar--compact">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Everyone</option>
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <Loader label="Loading users" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users match" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="data-table__strong">
                  {u.name} {u.id === currentUser.id && <span className="data-table__muted">(you)</span>}
                </td>
                <td className="data-table__muted">{u.email}</td>
                <td>
                  <button
                    className={`badge-btn ${u.is_admin ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => quickToggle(u, 'is_admin')}
                  >
                    {u.is_admin ? 'Admin' : 'Customer'}
                  </button>
                </td>
                <td>
                  <button
                    className={`badge-btn ${u.is_active ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => quickToggle(u, 'is_active')}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="data-table__muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="data-table__actions">
                  <button className="link-btn" onClick={() => openEdit(u)}>Edit</button>
                  {u.id !== currentUser.id && (
                    <button className="link-btn link-btn--danger" onClick={() => setDeleteTarget(u)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form className="panel-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert--error">{error}</div>}

            <div className="form-section">
              <span className="form-section__title">Account</span>

              <div className="form-row">
                <label>
                  Full name
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>

                <label>
                  Email
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
              </div>
            </div>

            <div className="form-section">
              <span className="form-section__title">Permissions</span>

              <div className="permission-list">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.is_admin}
                    onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                  />
                  Admin — can manage products, brands, categories and users
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.is_staff}
                    onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
                  />
                  Staff — can sign in to the Django admin site
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    disabled={editing.id === currentUser.id}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  Active — can sign in at all
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete user"
          message={`Delete "${deleteTarget.name}"? This can't be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}
