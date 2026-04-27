import { useEffect, useState } from 'react'
import api from '../../api/client.js'

export default function PresidentDashboard() {
  const [data, setData] = useState(null)
  const [teams, setTeams] = useState([])
  const [meetings, setMeetings] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/power-teams'), api.get('/meetings')])
      .then(([s, t, m]) => { setData(s.data); setTeams(t.data.powerTeams); setMeetings(m.data.meetings) })
      .catch((e) => setError(e.message))
  }, [])
  if (error) return <div className="alert error">{error}</div>
  if (!data) return <div className="page-loading">Loading…</div>
  return (
    <div>
      <div className="hint">Control + monitor: oversee teams, attendance, and TYFCB.</div>
      <div className="stat-grid">
        <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}><div className="stat-label">Power Teams</div><div className="stat-value">{data.totalPowerTeams}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #0ea5e9' }}><div className="stat-label">Members</div><div className="stat-value">{data.totalUsers}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}><div className="stat-label">Meetings</div><div className="stat-value">{data.totalMeetings}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}><div className="stat-label">TYFCB</div><div className="stat-value">₹{Number(data.tyfcbTotal).toLocaleString()}</div></div>
      </div>
      <div className="grid-2" style={{ marginTop: 24 }}>
        <section className="panel">
          <h2 className="panel-title">Power teams</h2>
          <ul className="simple-list">
            {teams.map((t) => <li key={t._id}><strong>{t.name}</strong> <span className="cell-sub">— {t.members?.length || 0} members · Captain: {t.captain?.name || '—'}</span></li>)}
            {teams.length === 0 && <li className="muted">No teams yet</li>}
          </ul>
        </section>
        <section className="panel">
          <h2 className="panel-title">Recent meetings</h2>
          <ul className="simple-list">
            {meetings.slice(0, 8).map((m) => (
              <li key={m._id}>
                <strong>{m.title || m.powerTeam?.name}</strong>{' '}
                <span className="cell-sub">— {new Date(m.date).toLocaleDateString()} · ₹{m.tyfcb} · {m.referrals} refs</span>
              </li>
            ))}
            {meetings.length === 0 && <li className="muted">No meetings yet</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
