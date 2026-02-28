import React, { useMemo, useState } from 'react'
import { compareVersions } from '../../api/compareApi'
import ComparisonSummary from './ComparisonSummary'
import DiffViewer from './DiffViewer'

function lineSet(text) {
  return new Set(
    (text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  )
}

function localCompare(leftDraft, rightDraft) {
  const left = lineSet(leftDraft?.text)
  const right = lineSet(rightDraft?.text)

  const added = [...right].filter((line) => !left.has(line))
  const removed = [...left].filter((line) => !right.has(line))
  const modified = leftDraft?.text !== rightDraft?.text ? [{ clauseType: 'Draft Text', status: 'modified' }] : []
  const unchanged = [...right].filter((line) => left.has(line))

  return { added, removed, modified, unchanged }
}

export default function VersionCompare({ drafts = [], onResult }) {
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const leftDraft = useMemo(() => drafts.find((draft) => draft.id === leftId), [drafts, leftId])
  const rightDraft = useMemo(() => drafts.find((draft) => draft.id === rightId), [drafts, rightId])

  const runCompare = async () => {
    if (!leftDraft || !rightDraft) return
    setLoading(true)
    const apiResult = await compareVersions(leftDraft.id, rightDraft.id)
    const normalized =
      apiResult && (apiResult.added || apiResult.removed || apiResult.modified || apiResult.unchanged)
        ? apiResult
        : localCompare(leftDraft, rightDraft)
    setResult(normalized)
    onResult?.(normalized)
    setLoading(false)
  }

  return (
    <div className="page-section">
      <div className="card">
        <h3>Compare Drafts</h3>
        <div className="editor-toolbar-fields">
          <select className="input" value={leftId} onChange={(event) => setLeftId(event.target.value)}>
            <option value="">Select left draft</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.title}
              </option>
            ))}
          </select>
          <select className="input" value={rightId} onChange={(event) => setRightId(event.target.value)}>
            <option value="">Select right draft</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.title}
              </option>
            ))}
          </select>
        </div>
        <div className="suggest-actions" style={{ marginTop: 10 }}>
          <button className="btn" disabled={loading || !leftDraft || !rightDraft} onClick={runCompare}>
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
        <ComparisonSummary result={result} />
      </div>
      <DiffViewer result={result} />
    </div>
  )
}
