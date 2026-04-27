import { useEffect, useState } from 'react'
import api from '../../api/client.js'

export default function CoordinatorDashboard() {
  const [data, setData] = useState(null)
  const [teams, setTeams] = useState([])
  useEffect(() => {
    api.get('/dashboard/summary').then((r) => setData(r.data))
    api.get('/power-teams').then((r) => setTeams(r.data.powerTeams))
  }, [])
  if (!data) return <div className="page-loading">Loading…</div>
  return (
    <div>
      <div className="hint">Build and manage your power teams.</div>
      <div className="stat-grid">
        <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="stat-label">Power Teams</div>
          <div className="stat-value">{data.totalPowerTeams}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #0ea5e9' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{data.totalUsers}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="stat-label">Chapters</div>
          <div className="stat-value">{data.totalChapters}</div>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">Recent power teams</h2>
        <ul className="simple-list">
          {teams.slice(0, 6).map((t) => (
            <li key={t._id}><strong>{t.name}</strong> <span className="cell-sub">— {t.chapter?.name} · {t.members?.length || 0} members</span></li>
          ))}
          {teams.length === 0 && <li className="muted">No power teams yet</li>}
        </ul>
      </section>
    </div>
  )
}
