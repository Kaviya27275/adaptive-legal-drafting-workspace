import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { fetchClauseLibraryAll, fetchClauseLibraryByDocumentType, searchClauses } from '../api/clauseApi'

export default function ClausesPage() {
  const { precedentTemplates, drafts, clauseTypes, insertPrecedentClause, addClause } = useWorkspace()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [targetDraftId, setTargetDraftId] = useState(drafts[0]?.id || '')
  const [libraryByType, setLibraryByType] = useState([])
  const [libraryAll, setLibraryAll] = useState([])
  const [semanticResults, setSemanticResults] = useState([])
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [semanticError, setSemanticError] = useState('')

  const [customClause, setCustomClause] = useState({
    type: clauseTypes[0],
    title: '',
    text: ''
  })

  useEffect(() => {
    if (!targetDraftId && drafts.length) {
      setTargetDraftId(drafts[0].id)
    }
  }, [drafts, targetDraftId])

  useEffect(() => {
    const load = async () => {
      const draft = drafts.find((item) => item.id === targetDraftId)
      if (!draft) {
        setLibraryByType([])
        return
      }
      const data = await fetchClauseLibraryByDocumentType(draft.documentTypeId)
      setLibraryByType(data)
    }
    load()
  }, [drafts, targetDraftId])

  useEffect(() => {
    const loadAll = async () => {
      const data = await fetchClauseLibraryAll()
      setLibraryAll(data)
    }
    loadAll()
  }, [])

  const clauseTypeLabels = {
    PAYMENT: 'Payment Terms',
    TERMINATION: 'Termination',
    CONFIDENTIALITY: 'Confidentiality',
    LIABILITY: 'Liability',
    OTHER: 'Other'
  }

  const toLabel = (value) => clauseTypeLabels[value] || value || 'Other'

  const filteredTemplates = useMemo(() => {
    const term = search.toLowerCase().trim()
    return precedentTemplates.filter((item) => {
      const matchesType = typeFilter === 'All' || item.clauseType === typeFilter
      const matchesSearch =
        !term ||
        item.clauseType.toLowerCase().includes(term) ||
        item.snippet.toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [precedentTemplates, typeFilter, search])

  const allTypes = useMemo(() => ['All', ...new Set(precedentTemplates.map((item) => item.clauseType))], [precedentTemplates])

  const handleAddCustom = (event) => {
    event.preventDefault()
    if (!targetDraftId || !customClause.title.trim() || !customClause.text.trim()) return
    addClause(targetDraftId, {
      type: customClause.type,
      title: customClause.title.trim(),
      text: customClause.text.trim()
    })
    setCustomClause((prev) => ({ ...prev, title: '', text: '' }))
  }

  const runSemanticSearch = async () => {
    const term = search.trim()
    if (!term) return
    setSemanticLoading(true)
    setSemanticError('')
    try {
      const draft = drafts.find((item) => item.id === targetDraftId)
      const results = await searchClauses(term, {
        document_type_id: draft?.documentTypeId
      })
      setSemanticResults(results)
    } catch (error) {
      setSemanticError(error?.response?.data?.error || 'Semantic search failed.')
    } finally {
      setSemanticLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clauses</h2>
        <p className="mt-2 text-slate-600">Search templates and add standard or custom clauses into any draft.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clauses"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {allTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={targetDraftId}
            onChange={(event) => setTargetDraftId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>Target Draft: {draft.title}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runSemanticSearch}
            disabled={semanticLoading || !search.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {semanticLoading ? 'Searching...' : 'Semantic Search'}
          </button>
          {semanticError ? <span className="text-xs font-medium text-rose-600">{semanticError}</span> : null}
        </div>

        {semanticResults.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {semanticResults.map((result, index) => (
              <article key={result.entry?.id || index} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-emerald-900">{toLabel(result.entry?.clause_type)}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-700">
                    Score: {result.score}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{result.entry?.title}</p>
                <p className="mt-1 text-sm text-slate-700">{result.entry?.text}</p>
                <button
                  type="button"
                  onClick={() =>
                    addClause(targetDraftId, {
                      type: toLabel(result.entry?.clause_type),
                      title: result.entry?.title,
                      text: result.entry?.text
                    })
                  }
                  className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add to Draft
                </button>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-700">{template.clauseType}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.documentType}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{template.snippet}</p>
              <button
                type="button"
                onClick={() => insertPrecedentClause(targetDraftId, template)}
                className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Insert
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900">Clause Library by Document Type</h3>
        <p className="mt-1 text-sm text-slate-600">All clauses mapped to the selected draft’s document type.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {libraryByType.length ? (
            libraryByType.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-indigo-700">{toLabel(item.clause_type)}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {item.document_type}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                <button
                  type="button"
                  onClick={() =>
                    addClause(targetDraftId, {
                      type: toLabel(item.clause_type),
                      title: item.title,
                      text: item.text
                    })
                  }
                  className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add to Draft
                </button>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No clauses available for this document type.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900">All Clause Library (Grouped)</h3>
        <p className="mt-1 text-sm text-slate-600">Browse all document types and add clauses to the selected draft.</p>
        <div className="mt-4 space-y-4">
          {libraryAll.length ? (
            Object.entries(
              libraryAll.reduce((acc, item) => {
                const key = item.document_type_name || item.document_type || 'Unknown'
                acc[key] = acc[key] || []
                acc[key].push(item)
                return acc
              }, {})
            ).map(([docType, items]) => (
              <div key={docType} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{docType}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {items.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-indigo-700">{toLabel(item.clause_type)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                      <button
                        type="button"
                        onClick={() =>
                          addClause(targetDraftId, {
                            type: toLabel(item.clause_type),
                            title: item.title,
                            text: item.text
                          })
                        }
                        className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Add to Draft
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No clause library entries found.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900">Add Custom Clause</h3>
        <form onSubmit={handleAddCustom} className="mt-3 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={customClause.type}
              onChange={(event) => setCustomClause((prev) => ({ ...prev, type: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {clauseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              value={customClause.title}
              onChange={(event) => setCustomClause((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="Clause title"
            />
          </div>
          <textarea
            rows={5}
            value={customClause.text}
            onChange={(event) => setCustomClause((prev) => ({ ...prev, text: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder="Clause content"
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add to Draft</button>
            {targetDraftId ? (
              <Link to={`/draft/${targetDraftId}`} className="text-sm font-semibold text-indigo-600 hover:underline">
                Open Draft
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}
