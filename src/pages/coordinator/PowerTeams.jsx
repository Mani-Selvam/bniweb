import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function PowerTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [chapters, setChapters] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', chapter: '', captain: '', viceCaptain: '', members: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [t, c, u] = await Promise.all([api.get('/power-teams'), api.get('/chapters'), api.get('/users')])
    setTeams(t.data.powerTeams)
    setChapters(c.data.chapters)
    setUsers(u.data.users)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!form.chapter && chapters.length === 1) setForm((f) => ({ ...f, chapter: chapters[0]._id }))
  }, [chapters, form.chapter])

  const chapterUsers = useMemo(
    () => users.filter((u) => (u.chapter?._id || u.chapter) === form.chapter),
    [users, form.chapter]
  )

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }
  function toggleMember(id) {
    setForm((f) => ({ ...f, members: f.members.includes(id) ? f.members.filter((x) => x !== id) : [...f.members, id] }))
  }

  async function create(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/power-teams', {
        name: form.name,
        chapter: form.chapter,
        captain: form.captain || null,
        viceCaptain: form.viceCaptain || null,
        members: form.members,
      })
      setForm({ name: '', chapter: form.chapter, captain: '', viceCaptain: '', members: [] })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(t) {
    if (!confirm(`Delete power team "${t.name}"?`)) return
    await api.delete(`/power-teams/${t._id}`)
    load()
  }

  const isAdmin = user?.role === 'super_admin'

  return (
    <div className="grid-2">
      <section className="panel">
        <h2 className="panel-title">Create power team</h2>
        <form className="form" onSubmit={create}>
          <label className="field">
            <span>Chapter</span>
            <select value={form.chapter} onChange={(e) => setField('chapter', e.target.value)} required>
              <option value="">— Select —</option>
              {chapters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Team name</span><input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Essentials / Builders / Growth" required /></label>
          <label className="field">
            <span>Captain</span>
            <select value={form.captain} onChange={(e) => setField('captain', e.target.value)}>
              <option value="">— None —</option>
              {chapterUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </label>
          <label className="field">
            <span>Vice Captain</span>
            <select value={form.viceCaptain} onChange={(e) => setField('viceCaptain', e.target.value)}>
              <option value="">— None —</option>
              {chapterUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </label>
          <div className="field">
            <span>Members ({form.members.length} selected)</span>
            <div className="checkbox-list">
              {chapterUsers.length === 0 && <div className="muted small">Pick a chapter first</div>}
              {chapterUsers.map((u) => (
                <label key={u._id} className="checkbox-row">
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} />
                  <span>{u.name}</span>
                  <span className="cell-sub">{u.email}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="alert error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Create team'}</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-title">All power teams ({teams.length})</h2>
        <div className="team-list">
          {teams.map((t) => (
            <div key={t._id} className="team-card">
              <div className="team-head">
                <div>
                  <div className="team-name">{t.name}</div>
                  <div className="cell-sub">{t.chapter?.name}</div>
                </div>
                {(isAdmin || user?.role === 'coordinator') && (
                  <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>Delete</button>
                )}
              </div>
              <div className="team-leads">
                <div><strong>Captain:</strong> {t.captain?.name || '—'}</div>
                <div><strong>Vice Captain:</strong> {t.viceCaptain?.name || '—'}</div>
              </div>
              <div className="team-members">
                <strong>Members ({t.members?.length || 0}):</strong>{' '}
                {(t.members || []).map((m) => m.name).join(', ') || '—'}
              </div>
            </div>
          ))}
          {teams.length === 0 && <div className="muted center">No power teams yet</div>}
        </div>
      </section>
    </div>
  )
}
