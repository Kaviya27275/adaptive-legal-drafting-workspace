import React from 'react'
import RuleSummary from './RuleSummary'
import ValidationWarnings from './ValidationWarnings'

export default function ComplianceReport({ report, loading, error, onRunCheck }) {
  return (
    <div className="card compliance-panel">
      <div className="panel-head">
        <h4>Compliance Check</h4>
        <button className="btn ghost" onClick={onRunCheck} disabled={loading}>
          {loading ? 'Checking...' : 'Run Check'}
        </button>
      </div>

      {!report ? (
        <p className="muted-text">Run compliance check to validate required clauses for the selected document type.</p>
      ) : (
        <>
          <p className={`status-chip ${report.isCompliant ? 'ok' : 'warn'}`}>
            {report.isCompliant ? 'Compliant' : 'Warnings Found'} • {report.documentTypeLabel}
          </p>
          <RuleSummary report={report} />
          <ValidationWarnings warnings={report.warnings} />
        </>
      )}

      {error ? <p className="danger-text">{error}</p> : null}
    </div>
  )
}
