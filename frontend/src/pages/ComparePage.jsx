import { useMemo, useState } from 'react'
import { compareDrafts, compareVersions } from '../api/compareApi'
import { useWorkspace } from '../context/WorkspaceContext'

function Section({ title, items, renderItem, emptyText }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map(renderItem) : <p className="text-sm text-slate-500">{emptyText}</p>}
      </div>
    </section>
  )
}

export default function ComparePage() {
  const { drafts } = useWorkspace()
  const [leftDraftId, setLeftDraftId] = useState('')
  const [rightDraftId, setRightDraftId] = useState('')
  const [result, setResult] = useState(null)
  const [versionResult, setVersionResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareMode, setCompareMode] = useState('drafts')
  const [versionDraftId, setVersionDraftId] = useState('')
  const [versionAId, setVersionAId] = useState('')
  const [versionBId, setVersionBId] = useState('')

  const leftDraft = useMemo(
    () => drafts.find((draft) => String(draft.id) === String(leftDraftId)) || null,
    [drafts, leftDraftId]
  )
  const rightDraft = useMemo(
    () => drafts.find((draft) => String(draft.id) === String(rightDraftId)) || null,
    [drafts, rightDraftId]
  )

  const versionDraft = useMemo(
    () => drafts.find((draft) => String(draft.id) === String(versionDraftId)) || null,
    [drafts, versionDraftId]
  )
  const versionA = useMemo(
    () => (versionDraft?.versions || []).find((version) => String(version.id) === String(versionAId)) || null,
    [versionDraft, versionAId]
  )
  const versionB = useMemo(
    () => (versionDraft?.versions || []).find((version) => String(version.id) === String(versionBId)) || null,
    [versionDraft, versionBId]
  )

  const handleCompare = async () => {
    if (compareMode === 'versions') {
      if (!versionAId || !versionBId || versionAId === versionBId) return
      setLoading(true)
      setError('')
      try {
        const response = await compareVersions(versionAId, versionBId)
        setVersionResult(response)
        setResult(null)
      } catch (err) {
        const message = err?.response?.data?.error || 'Unable to compare versions.'
        setError(message)
        setVersionResult(null)
      } finally {
        setLoading(false)
      }
      return
    }

    if (!leftDraftId || !rightDraftId || leftDraftId === rightDraftId) return
    setLoading(true)
    setError('')
    try {
      const response = await compareDrafts(leftDraftId, rightDraftId)
      setResult(response)
      setVersionResult(null)
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to compare drafts.'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const added = result?.clause_diff?.added || []
  const removed = result?.clause_diff?.removed || []
  const modified = result?.clause_diff?.modified || []
  const unchanged = result?.clause_diff?.unchanged || []
  const normalizeLine = (line) => {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) return ''
    if (line.startsWith('+') || line.startsWith('-')) return line.slice(1).trim()
    return line.trim()
  }

  const buildSideBySide = (lines) => {
    const rows = []
    lines.forEach((line) => {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) return
      if (line.startsWith('+')) {
        rows.push({ left: '', right: normalizeLine(line), type: 'added' })
        return
      }
      if (line.startsWith('-')) {
        rows.push({ left: normalizeLine(line), right: '', type: 'removed' })
        return
      }
      const text = normalizeLine(line)
      if (text.length) rows.push({ left: text, right: text, type: 'same' })
    })
    return rows
  }

  const lineDiffRows = buildSideBySide((result?.content_diff?.line_diff || []).slice(0, 400))
  const versionLineDiffRows = buildSideBySide((versionResult?.line_diff || []).slice(0, 400))

  const buildHighlightIndexes = (lines) => {
    const leftIndexes = new Set()
    const rightIndexes = new Set()
    let leftCursor = 0
    let rightCursor = 0

    lines.forEach((line) => {
      const header = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (header) {
        leftCursor = Math.max(0, Number(header[1]) - 1)
        rightCursor = Math.max(0, Number(header[2]) - 1)
        return
      }
      if (line.startsWith('+++') || line.startsWith('---')) return
      if (line.startsWith('\\')) return

      if (line.startsWith('-')) {
        leftIndexes.add(leftCursor)
        leftCursor += 1
        return
      }
      if (line.startsWith('+')) {
        rightIndexes.add(rightCursor)
        rightCursor += 1
        return
      }

      leftCursor += 1
      rightCursor += 1
    })

    return { leftIndexes, rightIndexes }
  }

  const draftHighlights = buildHighlightIndexes(result?.content_diff?.line_diff || [])
  const versionHighlights = buildHighlightIndexes(versionResult?.line_diff || [])

  const cellStyle = (type) => {
    if (type === 'added') return 'bg-emerald-50/50 text-slate-800'
    if (type === 'removed') return 'bg-rose-50/50 text-slate-800'
    return 'bg-white text-slate-600'
  }

  const renderFullText = (text, highlightIndexes, side) => {
    const lines = (text || '').split('\n')
    return lines.map((line, idx) => {
      const isHighlight = highlightIndexes.has(idx)
      return (
        <div
          key={`${side}-${idx}`}
          className={`grid grid-cols-[52px_minmax(0,1fr)] items-start gap-2 whitespace-pre-wrap rounded px-2 py-1 text-sm ${
            isHighlight ? (side === 'left' ? 'bg-rose-50/50' : 'bg-emerald-50/50') : ''
          }`}
        >
          <span className="select-none text-right text-xs text-slate-400">{idx + 1}</span>
          <span>{line || '\u00A0'}</span>
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Draft Comparison</h2>
        <p className="mt-2 text-slate-600">Compare two drafts and review content and clause changes.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCompareMode('drafts')}
            className={`rounded-full px-4 py-1 text-sm font-semibold ${
              compareMode === 'drafts' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Compare Drafts
          </button>
          <button
            type="button"
            onClick={() => setCompareMode('versions')}
            className={`rounded-full px-4 py-1 text-sm font-semibold ${
              compareMode === 'versions' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Compare Versions
          </button>
        </div>

        {compareMode === 'drafts' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={leftDraftId}
              onChange={(event) => setLeftDraftId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Select Draft A</option>
              {drafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.title}
                </option>
              ))}
            </select>

            <select
              value={rightDraftId}
              onChange={(event) => setRightDraftId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Select Draft B</option>
              {drafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCompare}
              disabled={loading || !leftDraftId || !rightDraftId || leftDraftId === rightDraftId}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Drafts'}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={versionDraftId}
              onChange={(event) => {
                setVersionDraftId(event.target.value)
                setVersionAId('')
                setVersionBId('')
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Select Draft</option>
              {drafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.title}
                </option>
              ))}
            </select>
            <select
              value={versionAId}
              onChange={(event) => setVersionAId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              disabled={!versionDraft}
            >
              <option value="">Select Version A</option>
              {(versionDraft?.versions || []).map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label} • {new Date(version.savedAt).toLocaleString()}
                </option>
              ))}
            </select>
            <select
              value={versionBId}
              onChange={(event) => setVersionBId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              disabled={!versionDraft}
            >
              <option value="">Select Version B</option>
              {(versionDraft?.versions || []).map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label} • {new Date(version.savedAt).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCompare}
              disabled={loading || !versionAId || !versionBId || versionAId === versionBId}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Versions'}
            </button>
          </div>
        )}

        <div className="mt-3 text-sm text-slate-600">
          <p>Draft A: {leftDraft?.title || '-'}</p>
          <p>Draft B: {rightDraft?.title || '-'}</p>
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      </div>

      {compareMode === 'drafts' && result ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase text-emerald-700">Added Clauses</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{added.length}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase text-rose-700">Removed Clauses</p>
              <p className="mt-1 text-2xl font-bold text-rose-800">{removed.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase text-amber-700">Modified Clauses</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{modified.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-700">Unchanged Clauses</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{unchanged.length}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section
              title="Added Clauses"
              items={added}
              emptyText="No added clauses."
              renderItem={(item) => (
                <article key={item.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-900">{item.title}</p>
                  <p className="mt-1 text-sm text-emerald-800">{item.text}</p>
                </article>
              )}
            />
            <Section
              title="Removed Clauses"
              items={removed}
              emptyText="No removed clauses."
              renderItem={(item) => (
                <article key={item.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-semibold text-rose-900">{item.title}</p>
                  <p className="mt-1 text-sm text-rose-800">{item.text}</p>
                </article>
              )}
            />
          </div>

          <Section
            title="Modified Clauses"
            items={modified}
            emptyText="No modified clauses."
            renderItem={(item, idx) => (
              <article key={`${item.title}-${idx}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">{item.title}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-amber-700">Before</p>
                    <p className="text-sm text-amber-900">{item.before?.text}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-amber-700">After</p>
                    <p className="text-sm text-amber-900">{item.after?.text}</p>
                  </div>
                </div>
              </article>
            )}
          />

          <Section
            title="Line-by-Line Changes"
            items={lineDiffRows}
            emptyText="No textual differences."
            renderItem={(row, idx) => (
              <div key={`draft-row-${idx}`} className="grid grid-cols-2 gap-2">
                <div className={`rounded border border-slate-200 px-2 py-1 text-sm ${cellStyle(row.type)}`}>
                  {row.left || '\u00A0'}
                </div>
                <div className={`rounded border border-slate-200 px-2 py-1 text-sm ${cellStyle(row.type)}`}>
                  {row.right || '\u00A0'}
                </div>
              </div>
            )}
          />

          <Section
            title="Full Draft Comparison"
            items={[{ id: 'full-draft' }]}
            emptyText="No textual differences."
            renderItem={() => (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {leftDraft?.title || 'Draft A'}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-3 py-2 text-slate-700">
                    {renderFullText(leftDraft?.bodyText || '', draftHighlights.leftIndexes, 'left')}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {rightDraft?.title || 'Draft B'}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-3 py-2 text-slate-700">
                    {renderFullText(rightDraft?.bodyText || '', draftHighlights.rightIndexes, 'right')}
                  </div>
                </div>
              </div>
            )}
          />
        </>
      ) : null}

      {compareMode === 'versions' && versionResult ? (
        <>
          <Section
            title="Line-by-Line Changes"
            items={versionLineDiffRows}
            emptyText="No textual differences."
            renderItem={(row, idx) => (
              <div key={`version-row-${idx}`} className="grid grid-cols-2 gap-2">
                <div className={`rounded border border-slate-200 px-2 py-1 text-sm ${cellStyle(row.type)}`}>
                  {row.left || '\u00A0'}
                </div>
                <div className={`rounded border border-slate-200 px-2 py-1 text-sm ${cellStyle(row.type)}`}>
                  {row.right || '\u00A0'}
                </div>
              </div>
            )}
          />

          <Section
            title="Full Version Comparison"
            items={[{ id: 'full-version' }]}
            emptyText="No textual differences."
            renderItem={() => (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {versionA ? `${versionA.label} - ${new Date(versionA.savedAt).toLocaleString()}` : 'Version A'}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-3 py-2 text-slate-700">
                    {renderFullText(versionA?.bodyText || '', versionHighlights.leftIndexes, 'left')}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {versionB ? `${versionB.label} - ${new Date(versionB.savedAt).toLocaleString()}` : 'Version B'}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-3 py-2 text-slate-700">
                    {renderFullText(versionB?.bodyText || '', versionHighlights.rightIndexes, 'right')}
                  </div>
                </div>
              </div>
            )}
          />
        </>
      ) : null}
    </div>
  )
}

