import React, { useContext } from 'react'
import { DraftContext } from '../../context/DraftContext'

export default function DraftList() {
  const { drafts, loading, activeDraftId, setActiveDraftId } = useContext(DraftContext)

  if (loading) return <div className="card">Loading drafts...</div>

  if (!drafts || drafts.length === 0) return <div className="card">No drafts yet</div>

  return (
    <div className="draft-list">
      {drafts.map((draft, idx) => (
        <button
          key={draft.id || idx}
          className={`draft-item ${activeDraftId === draft.id ? 'active' : ''}`}
          onClick={() => setActiveDraftId(draft.id)}
        >
          <div className="draft-item-head">
            <strong>{draft.title || 'Untitled'}</strong>
            <small>{new Date(draft.updated || Date.now()).toLocaleString()}</small>
          </div>
          <div className="draft-item-preview">
            <small>
              {(draft.text || '').slice(0, 110)}
              {(draft.text || '').length > 110 ? '...' : ''}
            </small>
          </div>
        </button>
      ))}
    </div>
  )
}
