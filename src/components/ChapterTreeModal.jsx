import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import Modal from './Modal.jsx'

const ROLE_LABEL = {
  president: 'President', vice_president: 'Vice President', coordinator: 'Coordinator',
  captain: 'Captain', vice_captain: 'Vice Captain', member: 'Member',
}

export default function ChapterTreeModal({ chapterId, open, onClose, basePath = '/admin' }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!open || !chapterId) return
    setData(null); setError('')
    api.get(`/chapters/${chapterId}/tree`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
  }, [open, chapterId])

  function createTeam() {
    onClose?.()
    navigate(`${basePath}/power-teams?createForChapter=${chapterId}`)
  }

  return (
    <Modal open={open} onClose={onClose} title={data ? `Chapter — ${data.chapter.name}` : 'Loading…'} width={760}>
      {error && <div className="alert error">{error}</div>}
      {!data && !error && <div className="page-loading">Loading…</div>}
      {data && (
        <div className="tree-view">
          <div className="tree-meta">
            <div><span className="muted small">Location</span><div>{data.chapter.location || '—'}</div></div>
            <div><span className="muted small">Officers</span><div>{data.counts.officers}</div></div>
            <div><span className="muted small">Members</span><div>{data.counts.members}</div></div>
            <div><span className="muted small">Power Teams</span><div>{data.counts.powerTeams}</div></div>
            <div><span className="muted small">Meetings</span><div>{data.counts.meetings}</div></div>
          </div>

          <div className="tree-section">
            <div className="tree-section-head">
              <h4>Officers</h4>
              <span className="badge muted">{data.officers.length}</span>
            </div>
            {data.officers.length === 0 && <div className="muted small pad-sm">No officers assigned</div>}
            {data.officers.map((o) => (
              <div key={o._id} className="tree-row">
                <div className="tree-bullet" />
                <div className="tree-name">{o.name}</div>
                <span className="chip role-chip">{ROLE_LABEL[o.role]}</span>
                <span className="cell-sub">{o.email}</span>
              </div>
            ))}
          </div>

          <div className="tree-section">
            <div className="tree-section-head">
              <h4>Power Teams</h4>
              <button className="btn btn-primary btn-sm" onClick={createTeam}>+ Create power team here</button>
            </div>
            {data.powerTeams.length === 0 && <div className="muted small pad-sm">No power teams yet — click "+ Create power team here" to add one.</div>}
            {data.powerTeams.map((t) => (
              <div key={t._id} className="tree-team">
                <div className="tree-team-head">
                  <div className="tree-team-name">⚡ {t.name}</div>
                  <span className="badge muted">{t.meetingCount} meetings</span>
                </div>
                <div className="tree-row sub">
                  <div className="tree-bullet" />
                  <span className="cell-sub">Captain</span>
                  <div className="tree-name">{t.captain?.name || '—'}</div>
                </div>
                <div className="tree-row sub">
                  <div className="tree-bullet" />
                  <span className="cell-sub">Vice Captain</span>
                  <div className="tree-name">{t.viceCaptain?.name || '—'}</div>
                </div>
                <div className="tree-row sub">
                  <div className="tree-bullet" />
                  <span className="cell-sub">Members ({t.members?.length || 0})</span>
                  <div className="member-chips">
                    {(t.members || []).map((m) => <span key={m._id} className="chip">{m.name}</span>)}
                    {(!t.members || t.members.length === 0) && <span className="muted small">No members</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.unassignedMembers.length > 0 && (
            <div className="tree-section">
              <div className="tree-section-head">
                <h4>Unassigned members</h4>
                <span className="badge muted">{data.unassignedMembers.length}</span>
              </div>
              <div className="member-chips">
                {data.unassignedMembers.map((m) => <span key={m._id} className="chip">{m.name}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
