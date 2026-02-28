import React from 'react'

export default function ComparisonSummary({ result }) {
  if (!result) {
    return <p className="muted-text">Select two versions to compare.</p>
  }

  return (
    <div className="compliance-summary">
      <div className="summary-item">
        <small>Added</small>
        <strong>{result.added?.length || 0}</strong>
      </div>
      <div className="summary-item">
        <small>Removed</small>
        <strong>{result.removed?.length || 0}</strong>
      </div>
      <div className="summary-item">
        <small>Modified</small>
        <strong>{result.modified?.length || 0}</strong>
      </div>
      <div className="summary-item">
        <small>Unchanged</small>
        <strong>{result.unchanged?.length || 0}</strong>
      </div>
    </div>
  )
}
