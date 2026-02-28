import React from 'react'

export default function RuleSummary({ report }) {
  if (!report) return null

  return (
    <div className="compliance-summary">
      <div className="summary-item">
        <small>Required</small>
        <strong>{report.requiredCount}</strong>
      </div>
      <div className="summary-item">
        <small>Detected</small>
        <strong>{report.presentCount}</strong>
      </div>
      <div className="summary-item">
        <small>Missing</small>
        <strong>{report.missingClauses?.length || 0}</strong>
      </div>
      <div className="summary-item">
        <small>Compliance Score</small>
        <strong>{report.score}%</strong>
      </div>
    </div>
  )
}
