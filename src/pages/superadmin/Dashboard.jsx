import { useEffect, useState } from 'react'
import api from '../../api/client.js'

const cards = [
  { key: 'totalChapters', label: 'Chapters', accent: '#6366f1' },
  { key: 'totalUsers', label: 'Users', accent: '#0ea5e9' },
  { key: 'totalPowerTeams', label: 'Power Teams', accent: '#10b981' },
  { key: 'totalMeetings', label: 'Meetings', accent: '#f59e0b' },
  { key: 'tyfcbTotal', label: 'TYFCB Total', accent: '#ef4444', isCurrency: true },
  { key: 'referralsTotal', label: 'Referrals', accent: '#8b5cf6' },
  { key: 'visitorsTotal', label: 'Visitors', accent: '#14b8a6' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/summary').then((r) => setData(r.data)).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="alert error">{error}</div>
  if (!data) return <div className="page-loading">Loading…</div>

  return (
    <div>
      <div className="hint">Welcome back. Here's a snapshot of your network.</div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.key} className="stat-card" style={{ borderTop: `3px solid ${c.accent}` }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">
              {c.isCurrency ? '₹' : ''}
              {Number(data[c.key] || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
