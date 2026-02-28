import React from 'react'

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="loader-spinner" />
      <span>{label}</span>
    </div>
  )
}
