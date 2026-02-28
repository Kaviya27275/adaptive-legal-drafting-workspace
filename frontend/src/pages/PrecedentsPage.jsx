import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'

export default function PrecedentsPage() {
  const { precedentTemplates, drafts, insertPrecedentClause } = useWorkspace()
  const [search, setSearch] = useState('')
  const [documentType, setDocumentType] = useState('All')
  const [draftId, setDraftId] = useState(drafts[0]?.id || '')

  useEffect(() => {
    if (!draftId && drafts.length) {
      setDraftId(drafts[0].id)
    }
  }, [drafts, draftId])

  const documentTypes = useMemo(
    () => ['All', ...new Set(precedentTemplates.map((item) => item.documentType))],
    [precedentTemplates]
  )

  const filtered = useMemo(() => {
    return precedentTemplates.filter((template) => {
      const matchesType = documentType === 'All' || template.documentType === documentType
      const term = search.toLowerCase()
      const matchesSearch =
        template.clauseType.toLowerCase().includes(term) || template.snippet.toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [precedentTemplates, documentType, search])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Precedent Library</h2>
        <p className="mt-2 text-slate-600">Browse and insert clause templates into your active drafts.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clauses"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />

          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={draftId}
            onChange={(event) => setDraftId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                Insert into: {draft.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((template) => (
          <article key={template.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-indigo-700">{template.clauseType}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{template.documentType}</span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{template.snippet}</p>

            <button
              type="button"
              onClick={() => insertPrecedentClause(draftId, template)}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Insert
            </button>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No precedent templates matched your filters.
        </div>
      ) : null}

      {draftId ? (
        <Link to={`/draft/${draftId}`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Open Selected Draft
        </Link>
      ) : null}
    </div>
  )
}
