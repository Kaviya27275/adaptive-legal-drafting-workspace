import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LexoraIcon from '../common/LexoraIcon'

export default function Navbar() {
  const navigate = useNavigate()
  const handleHome = () => navigate('/')

  return (
    <div className="navbar">
      <div className="nav-left">
        <button onClick={handleHome} className="brand-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <LexoraIcon className="h-5 w-5" />
          <span>Lexora</span>
        </button>
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/drafts" className="nav-link">Drafts</Link>
        <Link to="/clauses" className="nav-link">Clauses</Link>
      </div>
      <div className="nav-right">
        <Link to="/login" className="nav-link">Login</Link>
      </div>
    </div>
  )
}
