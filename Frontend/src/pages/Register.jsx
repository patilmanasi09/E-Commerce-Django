import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { extractErrorMessage } from '../utils/helpers'

export default function Register() {
  const { register, login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await register(form.name, form.email, form.password, form.confirm_password)
      notify('Account created. Signing you in…', 'success')
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <span className="eyebrow">Create account</span>
        <h1>Join ShelfStock</h1>
        <p className="auth-card__hint">Registered through <code>/api/users/register/</code>, straight to your database.</p>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form-row">
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rahul Sharma"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              required
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              placeholder="Repeat your password"
            />
          </label>
        </div>

        <button className="btn btn--block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
