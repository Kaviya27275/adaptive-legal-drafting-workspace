import React from 'react'

export default function RiskWarning({ items = [] }) {
  if (items.length === 0) {
    return <div className="success-note">No risk warnings.</div>
  }

  return (
    <ul className="warning-list">
      {items.map((item, index) => (
        <li className="warning-item" key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}
