import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LexoraIcon from '../components/common/LexoraIcon'
import { useWorkspace } from '../context/WorkspaceContext'

const roles = ['Law Student', 'Lawyer']

function RoleIcon({ role }) {
  const common = 'h-6 w-6'

  if (role === 'Law Student') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7 12 3l9 4-9 4-9-4z" />
        <path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    )
  }

  if (role === 'Lawyer') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v6" />
        <path d="M8 9h8" />
        <path d="M5 9h14" />
        <path d="M7 9 4 15h6l3-6" />
        <path d="m17 9 3 6h-6l-3-6" />
        <path d="M12 15v6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 4 7v6c0 5 3.5 7.8 8 9 4.5-1.2 8-4 8-9V7l-8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { selectedRole, setSelectedRole } = useWorkspace()
  const [activeRole, setActiveRole] = useState(selectedRole)

  const handleContinue = () => {
    setSelectedRole(activeRole)
    navigate('/home')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-md md:p-12">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <LexoraIcon className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to Lexora Workspace</h1>
          <p className="mt-3 text-slate-600">Structured legal drafting with compliance intelligence.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const active = activeRole === role
            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <RoleIcon role={role} />
                </div>
                <p className="text-lg font-semibold text-slate-900">{role}</p>
                <p className="mt-1 text-sm text-slate-600">Role-specific drafting experience.</p>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
