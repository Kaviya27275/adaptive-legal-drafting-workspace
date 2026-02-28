import { Link, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../routes'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">No page exists at <span className="font-semibold text-slate-800">{location.pathname}</span>.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={APP_ROUTES.home} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Go Home
          </Link>
          <Link to={APP_ROUTES.login} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Go Login
          </Link>
        </div>
      </div>
    </div>
  )
}
