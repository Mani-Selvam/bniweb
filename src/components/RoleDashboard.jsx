import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import api from '../api/client.js'

const ROLE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
const ROLE_LABEL = {
  super_admin: 'Super Admin', president: 'President', vice_president: 'Vice President',
  coordinator: 'Coordinator', captain: 'Captain', vice_captain: 'Vice Captain', member: 'Member',
}

export default function RoleDashboard({ title, subtitle, statsConfig }) {
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

  const cards = statsConfig(data)
  const roleData = (trends.roles || []).map((r) => ({ name: ROLE_LABEL[r.role] || r.role, value: r.count }))
  const chapterData = trends.chapters || []
  const months = trends.months || []

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">{title}</h2>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
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
            <div className="stat-value">{c.isCurrency ? '₹' : ''}{Number(c.value || 0).toLocaleString()}</div>
            <div className="stat-bar"><span style={{ background: c.accent, width: `${Math.min(100, (Number(c.value) || 0) % 100 + 20)}%` }} /></div>
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
                <linearGradient id="rd-gMeet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="rd-gRef" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="rd-gVis" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="meetings" stroke="#6366f1" fill="url(#rd-gMeet)" strokeWidth={2} />
              <Area type="monotone" dataKey="referrals" stroke="#10b981" fill="url(#rd-gRef)" strokeWidth={2} />
              <Area type="monotone" dataKey="visitors" stroke="#f59e0b" fill="url(#rd-gVis)" strokeWidth={2} />
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
          <div className="panel-head"><h3 className="panel-title">{trends.chartLabel || 'Top chapters by members'}</h3></div>
          {chapterData.length === 0 ? <div className="muted center pad">No data yet</div> : (
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
