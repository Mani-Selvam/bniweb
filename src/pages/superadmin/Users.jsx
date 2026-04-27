import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client.js'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'

const ROLE_OPTIONS = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'captain', label: 'Captain' },
  { value: 'vice_captain', label: 'Vice Captain' },
  { value: 'member', label: 'Member' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default function Users() {
  const [users, setUsers] = useState([])
  const [chapters, setChapters] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'member', chapter: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [u, c] = await Promise.all([api.get('/users'), api.get('/chapters')])
    setUsers(u.data.users); setChapters(c.data.chapters)
  }
  useEffect(() => { load() }, [])

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.chapter?.name || '').toLowerCase().includes(q)
    )
  }, [users, search])

  async function add(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/users', { ...form, chapter: form.chapter || null })
      setForm({ name: '', phone: '', email: '', role: 'member', chapter: '' })
      setOpen(false)
      await load()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function updateRole(u, role) { await api.put(`/users/${u._id}`, { role }); load() }
  async function updateChapter(u, chapter) { await api.put(`/users/${u._id}`, { chapter: chapter || null }); load() }
  async function toggle(u) { await api.post(`/users/${u._id}/toggle-active`); load() }
  async function remove(u) {
    if (!confirm(`Delete ${u.name}?`)) return
    await api.delete(`/users/${u._id}`); load()
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Users"
        subtitle={`${filtered.length} of ${users.length} users`}
        search={search} onSearch={setSearch} searchPlaceholder="Search by name, email, phone, role, chapter"
        actionLabel="New user" onAction={() => setOpen(true)}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Chapter</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="cell-name">{u.name}</div>
                    <div className="cell-sub">{u.passwordSet ? 'Password set' : 'Awaiting first login'}</div>
                  </td>
                  <td>
                    <div>{u.phone}</div>
                    <div className="cell-sub">{u.email}</div>
                  </td>
                  <td>
                    <select value={u.role} onChange={(e) => updateRole(u, e.target.value)} className="select-inline">
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={u.chapter?._id || u.chapter || ''} onChange={(e) => updateChapter(u, e.target.value)} className="select-inline">
                      <option value="">—</option>
                      {chapters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td><span className={'badge ' + (u.isActive ? 'ok' : 'off')}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="muted center pad">{search ? 'No users match your search' : 'No users yet — click "New user" to add one'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Add user" width={560}>
        <form className="form" onSubmit={add}>
          <div className="grid-2-cols">
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setField('name', e.target.value)} required autoFocus /></label>
            <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="9876543210" required /></label>
          </div>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required /></label>
          <div className="grid-2-cols">
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={(e) => setField('role', e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Chapter</span>
              <select value={form.chapter} onChange={(e) => setField('chapter', e.target.value)}>
                <option value="">— None —</option>
                {chapters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          {error && <div className="alert error">{error}</div>}
          <div className="row-end">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Create user'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
