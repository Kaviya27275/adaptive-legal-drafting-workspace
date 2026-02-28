import React from 'react'

export default function SuggestionCard({ suggestion, onAccept, onReject }) {
  return (
    <div className="card">
      <strong>Suggestion</strong>
      <div className="suggestion-content">{suggestion || 'No suggestion generated yet.'}</div>
      <div className="suggest-actions">
        <button className="btn" onClick={() => onAccept?.(suggestion)} disabled={!suggestion}>
          Accept
        </button>
        <button className="btn ghost" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  )
}
