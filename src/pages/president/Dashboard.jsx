import RoleDashboard from '../../components/RoleDashboard.jsx'

const ICON = {
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  team: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  meet: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  ref: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6',
  vis: 'M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
}

export default function PresidentDashboard() {
  return (
    <RoleDashboard
      title="President Dashboard"
      subtitle="Oversee your chapter — teams, attendance, and TYFCB."
      statsConfig={(d) => [
        { key: 'totalUsers', label: 'Chapter Members', accent: '#0ea5e9', icon: ICON.users, value: d.totalUsers },
        { key: 'totalPowerTeams', label: 'Power Teams', accent: '#10b981', icon: ICON.team, value: d.totalPowerTeams },
        { key: 'totalMeetings', label: 'Meetings', accent: '#f59e0b', icon: ICON.meet, value: d.totalMeetings },
        { key: 'tyfcbTotal', label: 'TYFCB (₹)', accent: '#ef4444', icon: ICON.money, value: d.tyfcbTotal, isCurrency: true },
        { key: 'referralsTotal', label: 'Referrals', accent: '#8b5cf6', icon: ICON.ref, value: d.referralsTotal },
        { key: 'visitorsTotal', label: 'Visitors', accent: '#14b8a6', icon: ICON.vis, value: d.visitorsTotal },
      ]}
    />
  )
}
