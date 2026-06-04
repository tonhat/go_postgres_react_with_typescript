import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignout = () => {
    signout()
    navigate('/signin')
  }

  const closeMenu = () => setMenuOpen(false)

  const sidebar = (
    <aside className="bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <h1 className="text-lg md:text-xl font-bold text-indigo-600">EduManager</h1>
        <p className="text-xs text-gray-500 mt-1">Education Management</p>
      </div>
      <nav className="flex-1 p-2 md:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={closeMenu}
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
          <div className="font-medium text-gray-800 truncate">{user?.fullName}</div>
          <div className="text-xs truncate">{user?.email}</div>
          <div className="text-xs mt-1">
            <span className="badge badge-blue">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleSignout} className="btn btn-secondary w-full text-sm">
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </div>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        {sidebar}
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button
            className="text-gray-600 hover:text-gray-900 p-1"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-indigo-600">EduManager</h1>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
