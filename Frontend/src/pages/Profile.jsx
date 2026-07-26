import { useState, useEffect } from 'react' // 1. Import useEffect
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/axios'
import { extractErrorMessage } from '../utils/helpers'

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const { notify } = useToast()

  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // 2. Sync state when user object populates
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
      })
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await api.patch('/users/profile/update/', form)
      await refreshProfile()
      notify('Profile updated.', 'success')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <div className="container narrow">
      <div className="page-head">
        <h1>Your profile</h1>
        <p>Account #{user.id} · joined {new Date(user.created_at).toLocaleDateString()}</p>
      </div>

      <div className="status-row">
        <span className={`badge ${user.is_admin ? 'badge--featured' : 'badge--muted'}`}>
          {user.is_admin ? 'Admin' : 'Customer'}
        </span>
        <span className={`badge ${user.is_active ? 'badge--ok' : 'badge--out'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <form className="panel-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="form-row">
          <label>
            Full name
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}