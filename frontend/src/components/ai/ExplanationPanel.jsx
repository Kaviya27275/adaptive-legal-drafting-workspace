import React from 'react'

export default function ExplanationPanel({ text }) {
  if (!text) return null
  return (
    <div className="card">
      <strong>Explanation</strong>
      <p className="muted-text" style={{ marginTop: 8 }}>
        {text}
      </p>
    </div>
  )
}
