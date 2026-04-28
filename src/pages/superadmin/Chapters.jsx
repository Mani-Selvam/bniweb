import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client.js'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'

const EMPTY = { name: '', location: '' }

export default function Chapters() {
  const [chapters, setChapters] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const res = await api.get('/chapters')
      setChapters(res.data.chapters)
    } catch (err) { setError(err.message) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chapters
    return chapters.filter((c) => c.name.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q))
  }, [chapters, search])

  function openNew() {
    setEditing(null); setForm(EMPTY); setError(''); setOpen(true)
  }
  function openEdit(c) {
    setEditing(c); setForm({ name: c.name, location: c.location || '' }); setError(''); setOpen(true)
  }

  async function save(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (editing) {
        await api.put(`/chapters/${editing._id}`, { name: form.name, location: form.location })
      } else {
        await api.post('/chapters', { name: form.name, location: form.location })
      }
      setForm(EMPTY); setEditing(null); setOpen(false)
      await load()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function toggle(c) { await api.put(`/chapters/${c._id}`, { isActive: !c.isActive }); load() }
  async function remove(c) {
    if (!confirm(`Delete chapter "${c.name}"?`)) return
    await api.delete(`/chapters/${c._id}`); load()
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Chapters"
        subtitle={`${filtered.length} of ${chapters.length} chapters`}
        search={search} onSearch={setSearch} searchPlaceholder="Search by name or location"
        actionLabel="New chapter" onAction={openNew}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td data-label="Name"><div className="cell-name">{c.name}</div></td>
                  <td data-label="Location">{c.location || '—'}</td>
                  <td data-label="Status"><span className={'badge ' + (c.isActive ? 'ok' : 'off')}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td data-label="Actions" className="row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggle(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="muted center pad">{search ? 'No chapters match your search' : 'No chapters yet — click "New chapter" to add one'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit chapter — ${editing.name}` : 'Add chapter'}>
        <form className="form" onSubmit={save}>
          <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Beacon" required autoFocus /></label>
          <label className="field"><span>Location</span><input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="City (optional)" /></label>
          {error && <div className="alert error">{error}</div>}
          <div className="row-end">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : (editing ? 'Save changes' : 'Save chapter')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
