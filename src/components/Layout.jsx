import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  president: 'President',
  vice_president: 'Vice President',
  coordinator: 'Coordinator',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
  member: 'Member',
}

export default function Layout({ links = [], title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BNI</div>
          <div className="brand-text">
            <div className="brand-name">BNI Web</div>
            <div className="brand-role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span className="nav-icon">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{(user?.name || '?').slice(0, 1).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
