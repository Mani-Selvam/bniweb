import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const setupToken = sessionStorage.getItem('setup_token') || ''

  useEffect(() => {
    if (!setupToken) navigate('/login', { replace: true })
  }, [setupToken, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      const res = await api.post('/auth/set-password', { setupToken, password })
      login(res.data.token, res.data.user)
      sessionStorage.removeItem('setup_token')
      sessionStorage.removeItem('otp_identifier')
      navigate(dashboardPathForRole(res.data.user.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark big">BNI</div>
          <h1>Set your password</h1>
          <p>Choose a password for future logins.</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>New password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save & continue'}</button>
        </form>
      </div>
    </div>
  )
}
