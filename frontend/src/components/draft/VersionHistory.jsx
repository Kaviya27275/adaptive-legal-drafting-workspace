import React from 'react'

export default function VersionHistory({ versions = [], selectedId, onSelect }) {
  return (
    <div className="card">
      <h4>Version History</h4>
      {versions.length === 0 ? <p className="muted-text">No versions yet.</p> : null}
      <div className="draft-list">
        {versions.map((version, index) => (
          <button
            key={version.id || index}
            className={`draft-item ${selectedId === version.id ? 'active' : ''}`}
            onClick={() => onSelect?.(version)}
          >
            <div className="draft-item-head">
              <strong>{version.label || `Version ${index + 1}`}</strong>
              <small>{new Date(version.updated || Date.now()).toLocaleString()}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
