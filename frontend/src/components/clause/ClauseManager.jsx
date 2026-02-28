import React, { useMemo, useState } from 'react'
import ClauseForm from './ClauseForm'
import ClauseTag from './ClauseTag'

export default function ClauseManager({ value = [], onChange }) {
  const [editingClauseId, setEditingClauseId] = useState(null)

  const editingClause = useMemo(
    () => value.find((clause) => clause.id === editingClauseId) || null,
    [value, editingClauseId]
  )

  const emit = (nextClauses) => onChange?.(nextClauses)

  const addClause = (payload) => {
    const nextClause = {
      id: `clause-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      ...payload
    }
    emit([...value, nextClause])
  }

  const saveEditedClause = (payload) => {
    emit(value.map((clause) => (clause.id === payload.id ? { ...clause, ...payload } : clause)))
    setEditingClauseId(null)
  }

  const removeClause = (id) => {
    emit(value.filter((clause) => clause.id !== id))
  }

  const moveClause = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    emit(next)
  }

  return (
    <div className="page-section">
      {editingClause ? (
        <ClauseForm
          initialValue={editingClause}
          submitLabel="Save Clause"
          onSubmit={saveEditedClause}
          onCancel={() => setEditingClauseId(null)}
        />
      ) : (
        <ClauseForm onSubmit={addClause} />
      )}

      <div className="card">
        <h4>Draft Clauses</h4>
        {value.length === 0 ? <p className="muted-text">No clauses added yet.</p> : null}
        <div className="clause-list">
          {value.map((clause, index) => (
            <div className="clause-item" key={clause.id}>
              <div className="clause-item-head">
                <div>
                  <ClauseTag>{clause.type}</ClauseTag>
                  <strong>{clause.title}</strong>
                </div>
                <div className="suggest-actions">
                  <button className="btn ghost" onClick={() => moveClause(index, -1)}>
                    Up
                  </button>
                  <button className="btn ghost" onClick={() => moveClause(index, 1)}>
                    Down
                  </button>
                  <button className="btn ghost" onClick={() => setEditingClauseId(clause.id)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => removeClause(clause.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="muted-text">{clause.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
