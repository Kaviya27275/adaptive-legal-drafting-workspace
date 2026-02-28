import React from 'react'
import { Link } from 'react-router-dom'
import DraftList from '../draft/DraftList'

export default function Sidebar() {
  return (
    <div>
      <div className="sidebar-head">
        <h3>Workspace</h3>
        <Link to="/drafts" className="btn ghost">Open Editor</Link>
      </div>

      <div className="quick-actions">
        <strong>Quick actions</strong>
        <div className="quick-actions-grid">
          <Link to="/drafts" className="btn ghost">New draft</Link>
          <Link to="/clauses" className="btn ghost">Browse clauses</Link>
        </div>
      </div>

      <div>
        <strong>Recent drafts</strong>
        <div className="sidebar-drafts">
          <DraftList />
        </div>
      </div>
    </div>
  )
}
