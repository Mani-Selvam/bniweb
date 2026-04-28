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

const EMPTY = { name: '', phone: '', email: '', role: 'member', chapter: '' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [chapters, setChapters] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
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

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setOpen(true) }
  function openEdit(u) {
    setEditing(u)
    setForm({
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      role: u.role || 'member',
      chapter: u.chapter?._id || u.chapter || '',
    })
    setError(''); setOpen(true)
  }

  async function save(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, chapter: form.chapter || null }
      if (editing) {
        await api.put(`/users/${editing._id}`, payload)
      } else {
        await api.post('/users', payload)
      }
      setForm(EMPTY); setEditing(null); setOpen(false)
      await load()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

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
        actionLabel="New user" onAction={openNew}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Chapter</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td data-label="Name">
                    <div className="cell-name">{u.name}</div>
                    <div className="cell-sub">{u.passwordSet ? 'Password set' : 'Awaiting first login'}</div>
                  </td>
                  <td data-label="Contact">
                    <div>{u.phone}</div>
                    <div className="cell-sub">{u.email}</div>
                  </td>
                  <td data-label="Role">{(ROLE_OPTIONS.find((r) => r.value === u.role) || {}).label || u.role}</td>
                  <td data-label="Chapter">{u.chapter?.name || '—'}</td>
                  <td data-label="Status"><span className={'badge ' + (u.isActive ? 'ok' : 'off')}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td data-label="Actions" className="row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit user — ${editing.name}` : 'Add user'} width={560}>
        <form className="form" onSubmit={save}>
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
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : (editing ? 'Save changes' : 'Create user')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
