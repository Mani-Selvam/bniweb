import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

// Probe states:
//   null         → identifier not yet complete, just waiting for typing
//   'checking'   → looks complete, calling /auth/check-identifier
//   'found-pw'   → account exists AND has a password → show password field
//   'found-otp'  → account exists, no password yet → show "Send code" button
//   'notfound'   → no account found / inactive / network error
function isCompleteIdentifier(raw) {
  const s = (raw || '').trim()
  if (!s) return false
  if (s.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
  const digits = s.replace(/\D/g, '')
  return digits.length >= 10
}

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [probe, setProbe] = useState(null)        // 'checking' | 'found-pw' | 'found-otp' | 'notfound' | null
  const [probeMsg, setProbeMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(() => {
    const r = sessionStorage.getItem('logout_reason')
    if (r) sessionStorage.removeItem('logout_reason')
    return r || ''
  })
  const navigate = useNavigate()
  const { login } = useAuth()
  const passwordRef = useRef(null)

  // 🔍 Auto-check the database as the user types (debounced)
  useEffect(() => {
    setError('')
    const id = identifier.trim()
    if (!isCompleteIdentifier(id)) {
      setProbe(null); setProbeMsg(''); setName(''); return
    }
    let cancelled = false
    setProbe('checking'); setProbeMsg('')
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post('/auth/check-identifier', { identifier: id })
        if (cancelled) return
        setName(data.name || '')
        setProbe(data.passwordSet ? 'found-pw' : 'found-otp')
        setProbeMsg('')
      } catch (err) {
        if (cancelled) return
        setProbe('notfound')
        setProbeMsg(err.message || 'No account found')
      }
    }, 450)
    return () => { cancelled = true; clearTimeout(t) }
  }, [identifier])

  // When password field appears, focus it
  useEffect(() => { if (probe === 'found-pw') setTimeout(() => passwordRef.current?.focus(), 50) }, [probe])

  async function signIn(e) {
    e?.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login-password', { identifier: identifier.trim(), password })
      login(res.data.token, res.data.user)
      navigate(dashboardPathForRole(res.data.user.role), { replace: true })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function sendCode() {
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/request-otp', { identifier: identifier.trim(), purpose: 'login' })
      sessionStorage.setItem('otp_identifier', identifier.trim())
      sessionStorage.setItem('otp_expires', res.data.expiresAt)
      sessionStorage.setItem('otp_purpose', 'login')
      navigate('/verify-otp')
    } catch (err) { setError(err.message); setLoading(false) }
  }

  const helper = (() => {
    if (probe === 'checking') return { text: 'Checking your account…', tone: 'muted' }
    if (probe === 'found-pw') return { text: `Welcome back, ${name || 'there'}!`, tone: 'ok' }
    if (probe === 'found-otp') return { text: `Hi ${name || 'there'} — first time? Tap "Send one-time code".`, tone: 'info' }
    if (probe === 'notfound') return { text: probeMsg || 'No account found for this phone/email', tone: 'err' }
    return null
  })()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark big">BNI</div>
          <h1>Welcome back</h1>
          <p>Enter your phone or email — we'll detect your account automatically.</p>
        </div>

        <form className="form" onSubmit={signIn}>
          <label className="field">
            <span>Phone or Email</span>
            <div className={`input-wrap probe-${probe || 'idle'}`}>
              <input
                type="text"
                placeholder="9876543210 or you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                autoComplete="username"
                inputMode="text"
              />
              {probe === 'checking' && <span className="input-spinner" aria-label="Checking" />}
              {probe === 'found-pw' && <span className="input-tick ok">✓</span>}
              {probe === 'found-otp' && <span className="input-tick info">●</span>}
              {probe === 'notfound' && <span className="input-tick err">!</span>}
            </div>
            {helper && <span className={`field-helper ${helper.tone}`}>{helper.text}</span>}
          </label>

          {probe === 'found-pw' && (
            <>
              <label className="field">
                <span>Password</span>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} ref={passwordRef} autoComplete="current-password" />
              </label>
              {error && <div className="alert error">{error}</div>}
              {info && <div className="alert info">{info}</div>}
              <button className="btn btn-primary" disabled={loading || !password}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <div className="row-between">
                <button type="button" className="link small" onClick={sendCode} disabled={loading}>
                  Use one-time code
                </button>
                <Link to="/forgot-password" className="link small">Forgot password?</Link>
              </div>
            </>
          )}

          {probe === 'found-otp' && (
            <>
              {error && <div className="alert error">{error}</div>}
              {info && <div className="alert info">{info}</div>}
              <button type="button" className="btn btn-primary" onClick={sendCode} disabled={loading}>
                {loading ? 'Sending…' : 'Send one-time code'}
              </button>
              <p className="muted small center">
                You'll receive a 6-digit code on WhatsApp and email to set your password.
              </p>
            </>
          )}

          {probe === 'notfound' && (
            <>
              {error && <div className="alert error">{error}</div>}
              {info && <div className="alert info">{info}</div>}
              <button type="button" className="btn btn-secondary" onClick={sendCode} disabled={loading}>
                {loading ? 'Trying…' : 'Try sending a one-time code anyway'}
              </button>
              <p className="muted small center">
                If you still don't get a code, your account may not be set up yet — please contact your chapter admin.
              </p>
            </>
          )}

          {(probe === null || probe === 'checking') && (
            <>
              {error && <div className="alert error">{error}</div>}
              {info && <div className="alert info">{info}</div>}
              <p className="muted small center">
                Just type your phone or email — no Continue button needed.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
