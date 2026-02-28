import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import LexoraIcon from '../common/LexoraIcon'
import { useWorkspace } from '../../context/WorkspaceContext'
import { APP_ROUTES, SIDEBAR_MENU } from '../../routes'

export default function AppShell() {
  const { selectedRole, currentUser, logoutUser } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const visibleMenuItems = SIDEBAR_MENU.filter(
    (item) => !item.roles || item.roles.includes(selectedRole)
  )

  const handleLogout = () => {
    logoutUser()
    navigate(APP_ROUTES.login)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-6">
          <div className="flex items-center gap-2">
            <LexoraIcon className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Lexora</p>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900">Drafting Workspace</h1>
        </div>
        <nav className="grid gap-1 px-3 pb-4">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 md:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
              >
                <span className="sr-only">Menu</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <LexoraIcon className="h-10 w-10" />
              <p className="text-sm font-semibold text-slate-800">Lexora Workspace</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-slate-200" />
              <div>
                <p className="text-xs text-slate-500">Profile</p>
                <p className="text-sm font-semibold text-slate-800">{currentUser?.name || 'User'} ({selectedRole})</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="px-4 py-6 md:px-8">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
