import { useEffect, useState } from 'react'
import api from '../../api/client.js'

export default function Chapters() {
  const [chapters, setChapters] = useState([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const res = await api.get('/chapters')
      setChapters(res.data.chapters)
    } catch (err) {
      setError(err.message)
    }
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/chapters', { name, location })
      setName(''); setLocation('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggle(c) {
    await api.put(`/chapters/${c._id}`, { isActive: !c.isActive })
    load()
  }

  async function remove(c) {
    if (!confirm(`Delete chapter "${c.name}"?`)) return
    await api.delete(`/chapters/${c._id}`)
    load()
  }

  return (
    <div className="grid-2">
      <section className="panel">
        <h2 className="panel-title">Add chapter</h2>
        <form className="form" onSubmit={add}>
          <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Beacon" required /></label>
          <label className="field"><span>Location</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City (optional)" /></label>
          {error && <div className="alert error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save chapter'}</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-title">All chapters ({chapters.length})</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.location || '—'}</td>
                  <td><span className={'badge ' + (c.isActive ? 'ok' : 'off')}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggle(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {chapters.length === 0 && <tr><td colSpan={4} className="muted center">No chapters yet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
