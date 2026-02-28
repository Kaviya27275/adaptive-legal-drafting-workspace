import { useEffect } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function ComplianceReportsPage() {
  const { drafts, getCompliance, runComplianceCheck } = useWorkspace()

  useEffect(() => {
    if (!drafts.length) return
    drafts.forEach((draft) => {
      runComplianceCheck(draft.id)
    })
  }, [drafts, runComplianceCheck])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Compliance Reports</h2>
        <p className="mt-2 text-slate-600">Snapshot of compliance readiness across all drafts.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {drafts.map((draft) => {
          const compliance = getCompliance(draft)
          return (
            <article key={draft.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
              <p className="font-semibold text-slate-900">{draft.title}</p>
              <p className="mt-1 text-sm text-slate-600">{draft.documentType}</p>
              <p className="mt-3 text-sm text-slate-700">Compliance Score: {compliance.score}%</p>
              <p className="mt-1 text-sm text-slate-500">Missing: {compliance.missingClauses.join(', ') || 'None'}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
