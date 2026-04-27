import { useEffect, useState } from 'react'
import api from '../../api/client.js'

export default function VpDashboard() {
  const [data, setData] = useState(null)
  const [meetings, setMeetings] = useState([])
  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/meetings')]).then(([s, m]) => { setData(s.data); setMeetings(m.data.meetings) })
  }, [])
  if (!data) return <div className="page-loading">Loading…</div>
  const totalRefs = meetings.reduce((s, m) => s + (m.referrals || 0), 0)
  const totalVis = meetings.reduce((s, m) => s + (m.visitors || 0), 0)
  return (
    <div>
      <div className="hint">Reports & analytics across the chapter.</div>
      <div className="stat-grid">
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}><div className="stat-label">Meetings</div><div className="stat-value">{data.totalMeetings}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}><div className="stat-label">TYFCB</div><div className="stat-value">₹{Number(data.tyfcbTotal).toLocaleString()}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}><div className="stat-label">Referrals</div><div className="stat-value">{totalRefs}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid #14b8a6' }}><div className="stat-label">Visitors</div><div className="stat-value">{totalVis}</div></div>
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">Meeting reports</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Team</th><th>TYFCB</th><th>Referrals</th><th>Visitors</th></tr></thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m._id}>
                  <td>{new Date(m.date).toLocaleDateString()}</td>
                  <td>{m.powerTeam?.name || '—'}</td>
                  <td>₹{Number(m.tyfcb || 0).toLocaleString()}</td>
                  <td>{m.referrals || 0}</td>
                  <td>{m.visitors || 0}</td>
                </tr>
              ))}
              {meetings.length === 0 && <tr><td colSpan={5} className="muted center">No meetings recorded</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
