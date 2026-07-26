import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { extractErrorMessage } from '../utils/helpers'

export default function Login() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const user = await login(form.email, form.password)
      notify(`Welcome back, ${user.name.split(' ')[0]}.`, 'success')
      const redirectTo = location.state?.from?.pathname || (user.is_admin ? '/admin' : '/')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Sign in</span>
        <h1>Welcome back</h1>
        <p className="auth-card__hint">Use your ShelfStock account to check out or manage the shelves.</p>

        {error && <div className="alert alert--error">{error}</div>}

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

        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        <button className="btn btn--block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth-card__footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}
