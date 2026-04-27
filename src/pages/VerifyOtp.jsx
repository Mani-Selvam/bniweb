import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'

export default function VerifyOtp() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [info, setInfo] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const identifier = sessionStorage.getItem('otp_identifier') || ''

  useEffect(() => {
    if (!identifier) navigate('/login', { replace: true })
  }, [identifier, navigate])

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { identifier, code, purpose: 'login' })
      if (res.data.requiresPasswordSetup) {
        sessionStorage.setItem('setup_token', res.data.setupToken)
        navigate('/set-password')
        return
      }
      login(res.data.token, res.data.user)
      sessionStorage.removeItem('otp_identifier')
      sessionStorage.removeItem('otp_expires')
      navigate(dashboardPathForRole(res.data.user.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await api.post('/auth/request-otp', { identifier, purpose: 'login' })
      setInfo('A new code has been sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark big">BNI</div>
          <h1>Verify code</h1>
          <p>Enter the 6-digit code sent to <strong>{identifier}</strong></p>
        </div>
        <form onSubmit={handleVerify} className="form">
          <label className="field">
            <span>One-time code</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              className="otp-input"
            />
          </label>
          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert info">{info}</div>}
          <button className="btn btn-primary" disabled={loading || code.length < 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <div className="row-between">
            <button type="button" className="link small" onClick={resend} disabled={resending}>
              {resending ? 'Sending…' : 'Resend code'}
            </button>
            <button type="button" className="link small" onClick={() => navigate('/login')}>
              Change number
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
