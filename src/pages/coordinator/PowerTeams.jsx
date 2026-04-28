import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'

const EMPTY = { name: '', chapter: '', captain: '', viceCaptain: '', members: [] }

export default function PowerTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [chapters, setChapters] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [t, c, u] = await Promise.all([api.get('/power-teams'), api.get('/chapters'), api.get('/users')])
    setTeams(t.data.powerTeams); setChapters(c.data.chapters); setUsers(u.data.users)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!editing && !form.chapter && chapters.length === 1) setForm((f) => ({ ...f, chapter: chapters[0]._id }))
  }, [chapters, form.chapter, editing])

  const chapterUsers = useMemo(
    () => users.filter((u) => (u.chapter?._id || u.chapter) === form.chapter),
    [users, form.chapter]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      (t.chapter?.name || '').toLowerCase().includes(q) ||
      (t.captain?.name || '').toLowerCase().includes(q) ||
      (t.viceCaptain?.name || '').toLowerCase().includes(q) ||
      (t.members || []).some((m) => m.name.toLowerCase().includes(q))
    )
  }, [teams, search])

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }
  function toggleMember(id) {
    setForm((f) => ({ ...f, members: f.members.includes(id) ? f.members.filter((x) => x !== id) : [...f.members, id] }))
  }

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, chapter: chapters.length === 1 ? chapters[0]._id : '' })
    setError(''); setOpen(true)
  }
  function openEdit(t) {
    setEditing(t)
    setForm({
      name: t.name || '',
      chapter: t.chapter?._id || t.chapter || '',
      captain: t.captain?._id || t.captain || '',
      viceCaptain: t.viceCaptain?._id || t.viceCaptain || '',
      members: (t.members || []).map((m) => m._id || m),
    })
    setError(''); setOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (editing) {
        await api.put(`/power-teams/${editing._id}`, {
          name: form.name,
          captain: form.captain || null,
          viceCaptain: form.viceCaptain || null,
          members: form.members,
        })
      } else {
        await api.post('/power-teams', {
          name: form.name, chapter: form.chapter,
          captain: form.captain || null, viceCaptain: form.viceCaptain || null,
          members: form.members,
        })
      }
      setForm(EMPTY); setEditing(null); setOpen(false)
      await load()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function remove(t) {
    if (!confirm(`Delete power team "${t.name}"?`)) return
    await api.delete(`/power-teams/${t._id}`); load()
  }

  const isAdmin = user?.role === 'super_admin'
  const canManage = isAdmin || user?.role === 'coordinator'

  return (
    <div className="fade-in">
      <PageHeader
        title="Power Teams"
        subtitle={`${filtered.length} of ${teams.length} teams`}
        search={search} onSearch={setSearch} searchPlaceholder="Search team, chapter, captain or member"
        actionLabel={canManage ? 'New team' : undefined}
        onAction={canManage ? openNew : undefined}
      />

      <div className="team-grid">
        {filtered.map((t) => (
          <div key={t._id} className="team-card pop-in">
            <div className="team-head">
              <div>
                <div className="team-name">{t.name}</div>
                <div className="cell-sub">{t.chapter?.name}</div>
              </div>
              {canManage && (
                <div className="row-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>Delete</button>
                </div>
              )}
            </div>
            <div className="team-leads">
              <div><span className="muted small">Captain</span><div>{t.captain?.name || '—'}</div></div>
              <div><span className="muted small">Vice Captain</span><div>{t.viceCaptain?.name || '—'}</div></div>
            </div>
            <div className="team-members">
              <div className="muted small">Members ({t.members?.length || 0})</div>
              <div className="member-chips">
                {(t.members || []).map((m) => <span key={m._id} className="chip">{m.name}</span>)}
                {(!t.members || t.members.length === 0) && <span className="muted small">No members yet</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="muted center pad panel">{search ? 'No teams match your search' : 'No power teams yet'}</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit power team — ${editing.name}` : 'Create power team'} width={560}>
        <form className="form" onSubmit={save}>
          <div className="grid-2-cols">
            <label className="field">
              <span>Chapter</span>
              <select value={form.chapter} onChange={(e) => setField('chapter', e.target.value)} required disabled={!!editing}>
                <option value="">— Select —</option>
                {chapters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Team name</span><input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Essentials" required /></label>
          </div>
          <div className="grid-2-cols">
            <label className="field">
              <span>Captain</span>
              <select value={form.captain} onChange={(e) => setField('captain', e.target.value)}>
                <option value="">— None —</option>
                {chapterUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Vice Captain</span>
              <select value={form.viceCaptain} onChange={(e) => setField('viceCaptain', e.target.value)}>
                <option value="">— None —</option>
                {chapterUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </label>
          </div>
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
          <div className="row-end">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : (editing ? 'Save changes' : 'Create team')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
