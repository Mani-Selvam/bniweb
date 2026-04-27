import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  // step 1: identifier; step 2: password (if set); otp branch handled by /verify-otp page
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  async function sendOtpAndGo(purpose = 'login') {
    const res = await api.post('/auth/request-otp', { identifier, purpose })
    sessionStorage.setItem('otp_identifier', identifier)
    sessionStorage.setItem('otp_expires', res.data.expiresAt)
    sessionStorage.setItem('otp_purpose', purpose)
    navigate('/verify-otp')
  }

  async function handleContinue(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/check-identifier', { identifier })
      setName(data.name || '')
      if (data.passwordSet) {
        setStep(2)
      } else {
        // First-time user — auto-send OTP and go to verify
        setInfo('Welcome! Sending you a one-time code…')
        await sendOtpAndGo('login')
      }
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

  async function useOtpInstead() {
    setError('')
    setLoading(true)
    try {
      await sendOtpAndGo('login')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function reset() {
    setStep(1)
    setPassword('')
    setError('')
    setInfo('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark big">BNI</div>
          <h1>{step === 1 ? 'Welcome back' : `Hi ${name || 'there'} 👋`}</h1>
          <p>
            {step === 1
              ? 'Enter your phone or email to continue'
              : 'Enter your password to sign in'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleContinue} className="form">
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
            {info && <div className="alert info">{info}</div>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait…' : 'Continue'}
            </button>
            <p className="muted small center">
              First-time users get a one-time code on WhatsApp and email to set a password.
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePassword} className="form">
            <div className="identifier-pill">
              <span>{identifier}</span>
              <button type="button" className="link small" onClick={reset}>Change</button>
            </div>
            <label className="field">
              <span>Password</span>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading || !password}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="row-between">
              <button type="button" className="link small" onClick={useOtpInstead} disabled={loading}>
                Use OTP instead
              </button>
              <Link to="/forgot-password" className="link small">Forgot password?</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
