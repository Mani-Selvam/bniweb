import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, dashboardPathForRole } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import SetPassword from './pages/SetPassword.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import AdminDashboard from './pages/superadmin/Dashboard.jsx'
import AdminChapters from './pages/superadmin/Chapters.jsx'
import AdminUsers from './pages/superadmin/Users.jsx'
import AdminPowerTeams from './pages/superadmin/PowerTeams.jsx'
import PresidentDashboard from './pages/president/Dashboard.jsx'
import VpDashboard from './pages/vp/Dashboard.jsx'
import CoordinatorDashboard from './pages/coordinator/Dashboard.jsx'
import CoordinatorPowerTeams from './pages/coordinator/PowerTeams.jsx'
import CoordinatorUsers from './pages/coordinator/Users.jsx'
import MemberDashboard from './pages/MemberDashboard.jsx'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={dashboardPathForRole(user.role)} replace />
}

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '◆' },
  { to: '/admin/chapters', label: 'Chapters', icon: '🏢' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/power-teams', label: 'Power Teams', icon: '⚡' },
]

const coordinatorLinks = [
  { to: '/coordinator', label: 'Dashboard', end: true, icon: '◆' },
  { to: '/coordinator/members', label: 'Members', icon: '👥' },
  { to: '/coordinator/power-teams', label: 'Power Teams', icon: '⚡' },
]

const presidentLinks = [{ to: '/president', label: 'Dashboard', end: true, icon: '◆' }]
const vpLinks = [{ to: '/vp', label: 'Dashboard', end: true, icon: '◆' }]
const memberLinks = [{ to: '/me', label: 'Dashboard', end: true, icon: '◆' }]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute roles={['super_admin']}><Layout links={adminLinks} title="Super Admin" /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/chapters" element={<AdminChapters />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/power-teams" element={<AdminPowerTeams />} />
      </Route>

      <Route element={<ProtectedRoute roles={['president']}><Layout links={presidentLinks} title="President" /></ProtectedRoute>}>
        <Route path="/president" element={<PresidentDashboard />} />
      </Route>

      <Route element={<ProtectedRoute roles={['vice_president']}><Layout links={vpLinks} title="Vice President" /></ProtectedRoute>}>
        <Route path="/vp" element={<VpDashboard />} />
      </Route>

      <Route element={<ProtectedRoute roles={['coordinator']}><Layout links={coordinatorLinks} title="Coordinator" /></ProtectedRoute>}>
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
        <Route path="/coordinator/members" element={<CoordinatorUsers />} />
        <Route path="/coordinator/power-teams" element={<CoordinatorPowerTeams />} />
      </Route>

      <Route element={<ProtectedRoute><Layout links={memberLinks} title="My Dashboard" /></ProtectedRoute>}>
        <Route path="/me" element={<MemberDashboard />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
