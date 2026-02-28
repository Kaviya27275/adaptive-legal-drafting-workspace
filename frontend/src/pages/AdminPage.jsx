import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { fetchTrashDrafts } from '../api/draftApi'
import { listComparisonLogs } from '../api/compareApi'
import { fetchUsers } from '../api/authApi'

export default function AdminPage() {
  const { drafts, getCompliance, runComplianceCheck } = useWorkspace()
  const [trash, setTrash] = useState([])
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (!drafts.length) return
    drafts.forEach((draft) => {
      runComplianceCheck(draft.id)
    })
  }, [drafts, runComplianceCheck])

  useEffect(() => {
    const load = async () => {
      const [trashItems, logItems, userItems] = await Promise.all([
        fetchTrashDrafts(),
        listComparisonLogs(),
        fetchUsers()
      ])
      setTrash(trashItems)
      setLogs(logItems)
      setUsers(userItems)
    }
    load()
  }, [])

  const visibleDrafts = useMemo(() => {
    if (!selectedUserId) return drafts
    return drafts.filter((draft) => String(draft.createdById) === String(selectedUserId))
  }, [drafts, selectedUserId])

  const totals = visibleDrafts.reduce(
    (acc, draft) => {
      const compliance = getCompliance(draft)
      acc.totalDrafts += 1
      acc.totalClauses += draft.clauses.length
      acc.avgCompliance += compliance.score
      if (compliance.missingClauses.length > 0 || compliance.missingValues.length > 0) {
        acc.attentionNeeded += 1
      }
      return acc
    },
    { totalDrafts: 0, totalClauses: 0, avgCompliance: 0, attentionNeeded: 0 }
  )

  const avgCompliance = totals.totalDrafts ? Math.round(totals.avgCompliance / totals.totalDrafts) : 0

  const daysLeft = (deletedAt) => {
    if (!deletedAt) return 30
    const cutoff = new Date(deletedAt)
    cutoff.setDate(cutoff.getDate() + 30)
    const diff = Math.ceil((cutoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff < 0 ? 0 : diff
  }

  const recentLogs = useMemo(() => logs.slice(0, 8), [logs])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
        <p className="mt-2 text-slate-600">Operational view of drafts, compliance and version readiness.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <p className="text-xs text-slate-500">Total Drafts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.totalDrafts}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <p className="text-xs text-slate-500">Total Clauses</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.totalClauses}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <p className="text-xs text-slate-500">Avg Compliance</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{avgCompliance}%</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <p className="text-xs text-slate-500">Needs Attention</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{totals.attentionNeeded}</p>
        </article>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Draft Status</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Filter by user</label>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">Draft</th>
                <th className="py-2 pr-3 font-medium">Owner</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Versions</th>
                <th className="py-2 pr-3 font-medium">Compliance</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleDrafts.map((draft) => {
                const compliance = getCompliance(draft)
                const owner = users.find((user) => String(user.id) === String(draft.createdById))
                return (
                  <tr key={draft.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-900">{draft.title}</td>
                    <td className="py-2 pr-3 text-slate-600">{owner?.username || owner?.email || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600">{draft.documentType}</td>
                    <td className="py-2 pr-3 text-slate-600">{draft.versions.length}</td>
                    <td className="py-2 pr-3 text-slate-600">{compliance.score}%</td>
                    <td className="py-2">
                      <Link to={`/draft/${draft.id}`} className="font-semibold text-indigo-600 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900">Comparison Logs</h3>
          <div className="mt-3 space-y-2">
            {recentLogs.length ? (
              recentLogs.map((log, idx) => (
                <div key={`log-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Draft #{log.draft_id} — V{log.version_a} vs V{log.version_b}
                  <span className="ml-2 text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No comparison activity yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900">Trash</h3>
          <p className="mt-1 text-xs text-slate-500">Drafts are deleted automatically after 30 days.</p>
          <div className="mt-3 space-y-2">
            {trash.length ? (
              trash.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.document_type_name || item.documentType}</p>
                  <p className="text-xs text-slate-500">Deletes in {daysLeft(item.deleted_at)} days</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Trash is empty.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
