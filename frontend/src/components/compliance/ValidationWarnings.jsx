import React from 'react'

export default function ValidationWarnings({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return <div className="success-note">No compliance warnings.</div>
  }

  return (
    <ul className="warning-list">
      {warnings.map((warning, idx) => (
        <li key={`${warning}-${idx}`} className="warning-item">
          {warning}
        </li>
      ))}
    </ul>
  )
}
