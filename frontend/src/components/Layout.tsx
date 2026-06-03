import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/students', label: 'Students', icon: '🎓' },
  { to: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
  { to: '/courses', label: 'Courses', icon: '📚' },
  { to: '/classes', label: 'Classes', icon: '🏫' },
  { to: '/launches', label: 'Launches', icon: '🚀' },
  { to: '/grade-rules', label: 'Grade Rules', icon: '📋' },
  { to: '/transcripts', label: 'Transcripts', icon: '📜' },
  { to: '/fee-structures', label: 'Fees', icon: '💰' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/finance', label: 'Finance', icon: '📊' },
]

export default function Layout() {
  const { user, signout } = useAuth()
  const navigate = useNavigate()

  const handleSignout = () => {
    signout()
    navigate('/signin')
  }

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">EduManager</h1>
          <p className="text-xs text-gray-500 mt-1">Education Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">
            <div className="font-medium text-gray-800">{user?.fullName}</div>
            <div className="text-xs">{user?.email}</div>
            <div className="text-xs mt-1">
              <span className="badge badge-blue">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleSignout} className="btn btn-secondary w-full text-sm">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
