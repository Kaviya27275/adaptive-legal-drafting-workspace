import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LexoraIcon from '../components/common/LexoraIcon'
import { useWorkspace } from '../context/WorkspaceContext'
import { APP_ROUTES } from '../routes'

export default function Register() {
  const navigate = useNavigate()
  const { registerUser } = useWorkspace()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.role) {
      setError('Please select a role to continue.')
      return
    }

    const result = await registerUser(form)
    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate(result.user?.role === 'Admin' ? APP_ROUTES.admin : APP_ROUTES.home)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex items-center gap-2">
          <LexoraIcon className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Lexora</p>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">Mock registration flow for workspace onboarding.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-700">Select your role</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Admin', icon: 'user-shield' },
                { label: 'Lawyer', icon: 'gavel' },
                { label: 'Law Student', icon: 'grad-cap' }
              ].map((role) => {
                const active = form.role === role.label
                return (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: role.label }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
                    }`}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      {role.icon === 'user-shield' ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
                          <path d="M4 20a8 8 0 0 1 16 0" />
                          <path d="M12 2 6 5v4c0 3.5 2.5 5.8 6 7 3.5-1.2 6-3.5 6-7V5l-6-3z" />
                        </svg>
                      ) : null}
                      {role.icon === 'gavel' ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m14 3 7 7" />
                          <path d="M12 5 5 12" />
                          <path d="m8 9 7 7" />
                          <path d="M3 21h8" />
                        </svg>
                      ) : null}
                      {role.icon === 'grad-cap' ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 7 12 3 2 7l10 4 10-4z" />
                          <path d="M6 10v5c0 2.5 3 4 6 4s6-1.5 6-4v-5" />
                          <path d="M22 7v5" />
                        </svg>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold">{role.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {role.label === 'Admin' && 'Manage workspace settings and approvals.'}
                      {role.label === 'Lawyer' && 'Draft, review, and finalize agreements.'}
                      {role.label === 'Law Student' && 'Learn and assist with drafting workflows.'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
              placeholder="Your name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
              placeholder="you@company.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
              placeholder="Create password"
            />
          </div>

          {error ? <p className="md:col-span-2 text-sm font-medium text-rose-600">{error}</p> : null}

          <button
            type="submit"
            className="md:col-span-2 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Create Account
          </button>

          <p className="md:col-span-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to={APP_ROUTES.login} className="font-semibold text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
