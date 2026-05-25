import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo.png'

const navLinks = [
  { to: '/discovery', label: 'Discovery' },
  { to: '/matches', label: 'Matches' },
  { to: '/stats', label: 'Stats' },
  { to: '/profile', label: 'Profile' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <img src={logo} alt="Finder" className="h-8 w-auto shrink-0" />
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-rose-500' : 'text-gray-600 hover:text-gray-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
