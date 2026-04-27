import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'captain', label: 'Captain' },
  { value: 'vice_captain', label: 'Vice Captain' },
]
const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]))

export default function CoordinatorUsers() {
  const { user } = useAuth()
  const myChapter = user?.chapter?._id || user?.chapter || ''
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'member' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!myChapter) return
    const u = await api.get(`/users?chapter=${myChapter}`)
    setUsers(u.data.users)
  }
  useEffect(() => { load() }, [myChapter])

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  }, [users, search])

  async function add(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/users', { ...form })
      setForm({ name: '', phone: '', email: '', role: 'member' })
      setOpen(false)
      await load()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (!myChapter) {
    return <div className="alert error">You are not assigned to a chapter. Please contact a Super Admin.</div>
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Chapter Members"
        subtitle={`${filtered.length} of ${users.length} members in your chapter`}
        search={search} onSearch={setSearch} searchPlaceholder="Search by name, email, phone, role"
        actionLabel="New member" onAction={() => setOpen(true)}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Status</th></tr></thead>
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
                  <td data-label="Role">{ROLE_LABEL[u.role] || u.role}</td>
                  <td data-label="Status"><span className={'badge ' + (u.isActive ? 'ok' : 'off')}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="muted center pad">{search ? 'No members match your search' : 'No members yet — click "New member" to add one'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Add member to your chapter" width={520}>
        <form className="form" onSubmit={add}>
          <div className="grid-2-cols">
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setField('name', e.target.value)} required autoFocus /></label>
            <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="9876543210" required /></label>
          </div>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required /></label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={(e) => setField('role', e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          {error && <div className="alert error">{error}</div>}
          <div className="row-end">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Create member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
