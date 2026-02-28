import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LexoraIcon from '../components/common/LexoraIcon'
import { useWorkspace } from '../context/WorkspaceContext'
import { APP_ROUTES } from '../routes'

export default function Login() {
  const navigate = useNavigate()
  const { loginUser } = useWorkspace()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const result = await loginUser(form)
    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate(result.user?.role === 'Admin' ? APP_ROUTES.admin : APP_ROUTES.home)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex items-center gap-2">
          <LexoraIcon className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Lexora</p>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to continue to your home dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
              placeholder="Enter password"
            />
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Login
          </button>

          <p className="text-sm text-slate-600">
            New to Lexora?{' '}
            <Link to={APP_ROUTES.register} className="font-semibold text-indigo-600 hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
