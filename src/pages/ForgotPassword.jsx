import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetToken, setResetToken] = useState('')
  const navigate = useNavigate()

  async function sendOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/request-otp', { identifier, purpose: 'reset_password' })
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { identifier, code, purpose: 'reset_password' })
      setResetToken(res.data.resetToken)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function reset(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/auth/set-password', { setupToken: resetToken, password })
      navigate('/login', { replace: true })
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
          <h1>Reset password</h1>
          <p>{step === 1 ? "We'll send a code to your WhatsApp and email." : step === 2 ? `Code sent to ${identifier}.` : 'Choose your new password.'}</p>
        </div>

        {step === 1 && (
          <form className="form" onSubmit={sendOtp}>
            <label className="field"><span>Phone or Email</span><input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus /></label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</button>
          </form>
        )}

        {step === 2 && (
          <form className="form" onSubmit={verifyOtp}>
            <label className="field">
              <span>One-time code</span>
              <input className="otp-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading || code.length < 6}>{loading ? 'Verifying…' : 'Verify'}</button>
          </form>
        )}

        {step === 3 && (
          <form className="form" onSubmit={reset}>
            <label className="field"><span>New password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoFocus /></label>
            <label className="field"><span>Confirm password</span><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required /></label>
            {error && <div className="alert error">{error}</div>}
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Reset password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
