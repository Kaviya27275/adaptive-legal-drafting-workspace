import React from 'react'

function Section({ title, items = [], emptyText }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <ul className="warning-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="warning-item">
              {typeof item === 'string' ? item : `${item.clauseType}: text changed`}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DiffViewer({ result }) {
  if (!result) return null

  return (
    <div className="dashboard-grid">
      <Section title="Added" items={result.added} emptyText="No clauses added." />
      <Section title="Removed" items={result.removed} emptyText="No clauses removed." />
      <Section title="Modified" items={result.modified} emptyText="No modified clauses." />
      <Section title="Unchanged" items={result.unchanged} emptyText="No unchanged clauses." />
    </div>
  )
}
