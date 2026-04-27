import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import api from '../../api/client.js'

const cards = [
  { key: 'totalChapters', label: 'Chapters', accent: '#6366f1', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h2M9 13h2M9 17h2M13 9h2M13 13h2M13 17h2' },
  { key: 'totalUsers', label: 'Members', accent: '#0ea5e9', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { key: 'totalPowerTeams', label: 'Power Teams', accent: '#10b981', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'totalMeetings', label: 'Meetings', accent: '#f59e0b', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18' },
  { key: 'tyfcbTotal', label: 'TYFCB (₹)', accent: '#ef4444', isCurrency: true, icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { key: 'referralsTotal', label: 'Referrals', accent: '#8b5cf6', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6' },
  { key: 'visitorsTotal', label: 'Visitors', accent: '#14b8a6', icon: 'M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z' },
]

const ROLE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
const ROLE_LABEL = {
  super_admin: 'Super Admin', president: 'President', vice_president: 'Vice President',
  coordinator: 'Coordinator', captain: 'Captain', vice_captain: 'Vice Captain', member: 'Member',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/dashboard/trends')])
      .then(([s, t]) => { setData(s.data); setTrends(t.data) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="alert error">{error}</div>
  if (!data || !trends) return <div className="page-loading">Loading dashboard…</div>

  const roleData = (trends.roles || []).map((r) => ({ name: ROLE_LABEL[r.role] || r.role, value: r.count }))
  const chapterData = trends.chapters || []
  const months = trends.months || []

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Dashboard</h2>
          <div className="page-subtitle">Welcome back. Here's a snapshot of your network.</div>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c, i) => (
          <div key={c.key} className="stat-card pop-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="stat-icon" style={{ background: `${c.accent}15`, color: c.accent }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icon} />
              </svg>
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">
              {c.isCurrency ? '₹' : ''}
              {Number(data[c.key] || 0).toLocaleString()}
            </div>
            <div className="stat-bar"><span style={{ background: c.accent, width: `${Math.min(100, (data[c.key] || 0) % 100 + 20)}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <section className="panel chart-panel fade-in" style={{ animationDelay: '120ms' }}>
          <div className="panel-head">
            <h3 className="panel-title">Activity trend (6 months)</h3>
            <span className="badge muted">Meetings · Referrals · Visitors</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gMeet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="gRef" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="meetings" stroke="#6366f1" fill="url(#gMeet)" strokeWidth={2} />
              <Area type="monotone" dataKey="referrals" stroke="#10b981" fill="url(#gRef)" strokeWidth={2} />
              <Area type="monotone" dataKey="visitors" stroke="#f59e0b" fill="url(#gVis)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="panel chart-panel fade-in" style={{ animationDelay: '180ms' }}>
          <div className="panel-head"><h3 className="panel-title">Members by role</h3></div>
          {roleData.length === 0 ? <div className="muted center pad">No members yet</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {roleData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel chart-panel wide fade-in" style={{ animationDelay: '240ms' }}>
          <div className="panel-head">
            <h3 className="panel-title">TYFCB by month (₹)</h3>
            <span className="badge muted">Thank You For Closed Business</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="tyfcb" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel chart-panel fade-in" style={{ animationDelay: '300ms' }}>
          <div className="panel-head"><h3 className="panel-title">Top chapters by members</h3></div>
          {chapterData.length === 0 ? <div className="muted center pad">No chapter data yet</div> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chapterData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  )
}
