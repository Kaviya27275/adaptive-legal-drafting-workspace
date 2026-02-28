import React, { useEffect, useState } from 'react'

const DEFAULT_TYPES = [
  'Definitions',
  'Payment Terms',
  'Confidentiality',
  'Termination',
  'Indemnity',
  'Jurisdiction'
]

export default function ClauseForm({
  initialValue,
  clauseTypes = DEFAULT_TYPES,
  submitLabel = 'Add Clause',
  onSubmit,
  onCancel
}) {
  const [type, setType] = useState(clauseTypes[0] || 'General')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (!initialValue) return
    setType(initialValue.type || clauseTypes[0] || 'General')
    setTitle(initialValue.title || '')
    setText(initialValue.text || '')
  }, [initialValue, clauseTypes])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim() || !text.trim()) return
    onSubmit?.({
      ...initialValue,
      type,
      title: title.trim(),
      text: text.trim()
    })
    if (!initialValue) {
      setTitle('')
      setText('')
    }
  }

  return (
    <form className="card clause-form" onSubmit={handleSubmit}>
      <h4>{initialValue ? 'Edit Clause' : 'Add Clause'}</h4>
      <select className="input" value={type} onChange={(event) => setType(event.target.value)}>
        {clauseTypes.map((clauseType) => (
          <option key={clauseType} value={clauseType}>
            {clauseType}
          </option>
        ))}
      </select>
      <input
        className="input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Clause title"
      />
      <textarea
        className="editor-textarea"
        style={{ minHeight: 160 }}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Clause text"
      />
      <div className="suggest-actions">
        <button className="btn" type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
