import { useAuth } from '../context/AuthContext.jsx'

export default function MemberDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <div className="hint">Welcome, {user?.name}.</div>
      <section className="panel">
        <h2 className="panel-title">Your account</h2>
        <ul className="simple-list">
          <li><strong>Name:</strong> {user?.name}</li>
          <li><strong>Email:</strong> {user?.email}</li>
          <li><strong>Phone:</strong> {user?.phone}</li>
          <li><strong>Role:</strong> {user?.role}</li>
        </ul>
        <p className="muted small" style={{ marginTop: 12 }}>
          Meeting submissions happen from the mobile app. Ask your captain for access.
        </p>
      </section>
    </div>
  )
}
