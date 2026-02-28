import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { deleteAllTrash, deleteDraftPermanently, fetchTrashDrafts, restoreDraft } from '../api/draftApi'
import { listComparisonLogs } from '../api/compareApi'

export default function MyDraftsPage() {
  const { drafts, deleteDraft } = useWorkspace()
  const [trash, setTrash] = useState([])
  const [logs, setLogs] = useState([])
  const today = new Date()
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())

  const loadSideData = async () => {
    const [trashItems, logItems] = await Promise.all([fetchTrashDrafts(), listComparisonLogs()])
    setTrash(trashItems)
    setLogs(logItems)
  }

  useEffect(() => {
    loadSideData()
  }, [])

  const typeColors = {
    'Service Agreement': 'bg-emerald-500',
    'Employment Contract': 'bg-indigo-500',
    'Lease Agreement': 'bg-amber-500',
    'Non Disclosure Agreement': 'bg-rose-500',
    'Consultancy Agreement': 'bg-sky-500'
  }

  const toLocalDateKey = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selectedMonthDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const created = new Date(draft.createdAt)
      if (Number.isNaN(created.getTime())) return false
      return created.getFullYear() === calendarYear && created.getMonth() === calendarMonth
    })
  }, [drafts, calendarMonth, calendarYear])

  const calendar = useMemo(() => {
    const year = calendarYear
    const month = calendarMonth
    const first = new Date(year, month, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const draftByDate = {}
    selectedMonthDrafts.forEach((draft) => {
      const date = toLocalDateKey(draft.createdAt)
      if (!date) return
      if (!draftByDate[date]) draftByDate[date] = []
      draftByDate[date].push(draft)
    })

    const comparisonDates = new Set(
      logs
        .map((log) => toLocalDateKey(log.created_at))
        .filter(Boolean)
    )

    const cells = []
    for (let i = 0; i < startDay; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = toLocalDateKey(new Date(year, month, d))
      cells.push({
        day: d,
        date,
        drafts: draftByDate[date] || [],
        hasComparison: comparisonDates.has(date)
      })
    }
    return {
      monthLabel: new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      cells
    }
  }, [selectedMonthDrafts, logs, calendarMonth, calendarYear])

  const daysLeft = (deletedAt) => {
    if (!deletedAt) return 30
    const cutoff = new Date(deletedAt)
    cutoff.setDate(cutoff.getDate() + 30)
    const diff = Math.ceil((cutoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff < 0 ? 0 : diff
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Drafts</h2>
        <p className="mt-2 text-slate-600">Open any draft and continue structured clause editing.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Draft Calendar</h3>
          <div className="flex items-center gap-2">
            <select
              value={calendarMonth}
              onChange={(event) => setCalendarMonth(Number(event.target.value))}
              className="h-8 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
              aria-label="Month"
            >
              {[
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
              ].map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>
            <input
              value={calendarYear}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isNaN(next)) setCalendarYear(next)
              }}
              className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
              aria-label="Year"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendar.cells.map((cell, idx) => (
            <div
              key={`cell-${idx}`}
              className="min-h-[72px] rounded-xl border border-slate-200 bg-slate-50 p-2"
            >
              {cell ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{cell.day}</span>
                    {cell.hasComparison ? <span title="Comparison activity">⇄</span> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cell.drafts.slice(0, 4).map((draft) => (
                      <span
                        key={`${cell.date}-${draft.id}`}
                        title={draft.documentType}
                        className={`h-3 w-3 rounded-full ${typeColors[draft.documentType] || 'bg-slate-400'}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
          {Object.entries(typeColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${color}`} />
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-sm">⇄</span>
            <span>Comparison activity</span>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {selectedMonthDrafts.map((draft) => (
          <article key={draft.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">{draft.title}</p>
              {draft.versions.length > 1 ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                  {draft.versions.length} versions
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">{draft.documentType}</p>
            <p className="mt-1 text-xs text-slate-500">{draft.clauses.length} clauses</p>
            <div className="mt-4 flex items-center gap-2">
              <Link to={`/draft/${draft.id}`} className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Open Draft
              </Link>
              <button
                type="button"
                onClick={async () => {
                  const ok = window.confirm('Delete this draft? This action cannot be undone.')
                  if (!ok) return
                  await deleteDraft(draft.id)
                  await loadSideData()
                }}
                className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {!selectedMonthDrafts.length ? (
          <p className="text-sm text-slate-500">
            No drafts were created in the selected month.
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Trash</h3>
            <p className="mt-1 text-sm text-slate-500">Drafts are automatically deleted after 30 days.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!trash.length) return
              const ok = window.confirm('Delete all drafts in trash permanently? This cannot be undone.')
              if (!ok) return
              await deleteAllTrash()
              await loadSideData()
            }}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Delete All
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {trash.length ? (
            trash.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.document_type_name || item.documentType}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Deleted: {new Date(item.deleted_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Deletes in {daysLeft(item.deleted_at)} days
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await restoreDraft(item.id)
                      await loadSideData()
                    }}
                    className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = window.confirm('Delete this draft permanently? This cannot be undone.')
                      if (!ok) return
                      await deleteDraftPermanently(item.id)
                      await loadSideData()
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete Permanently
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">Trash is empty.</p>
          )}
        </div>
      </section>
    </div>
  )
}
