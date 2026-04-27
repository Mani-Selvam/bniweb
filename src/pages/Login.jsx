import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('otp') // 'otp' | 'password'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/request-otp', { identifier, purpose: 'login' })
      sessionStorage.setItem('otp_identifier', identifier)
      sessionStorage.setItem('otp_expires', res.data.expiresAt)
      navigate('/verify-otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login-password', { identifier, password })
      login(res.data.token, res.data.user)
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
          <h1>Welcome back</h1>
          <p>Sign in to manage your chapter</p>
        </div>

        <div className="tabs">
          <button className={'tab' + (mode === 'otp' ? ' active' : '')} onClick={() => setMode('otp')}>OTP Login</button>
          <button className={'tab' + (mode === 'password' ? ' active' : '')} onClick={() => setMode('password')}>Password</button>
        </div>

        {mode === 'otp' ? (
          <form onSubmit={handleOtp} className="form">
            <label className="field">
              <span>Phone or Email</span>
              <input
                type="text"
                placeholder="9876543210 or you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Sending OTP…' : 'Send OTP'}</button>
            <p className="muted small">We'll send a 6-digit code to your WhatsApp and email.</p>
          </form>
        ) : (
          <form onSubmit={handlePassword} className="form">
            <label className="field">
              <span>Phone or Email</span>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
            <div className="row-between">
              <Link to="/forgot-password" className="link small">Forgot password?</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
