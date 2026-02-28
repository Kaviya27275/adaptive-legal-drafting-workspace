import React, { useContext, useState } from 'react'
import { ClauseContext } from '../../context/ClauseContext'

export default function ClauseSearch() {
  const [q, setQ] = useState('')
  const [searched, setSearched] = useState(false)
  const { results, search } = useContext(ClauseContext)

  const doSearch = async (event) => {
    event && event.preventDefault()
    setSearched(true)
    await search(q)
  }

  return (
    <div>
      <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search clauses"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <button className="btn">Search</button>
      </form>

      <div style={{ display: 'grid', gap: 8 }}>
        {!searched ? <div className="card">Search by term or click Search to view sample clauses.</div> : null}
        {searched && results && results.length === 0 ? <div className="card">No clauses found</div> : null}
        {results &&
          results.map((clause, idx) => (
            <div key={clause.id || idx} className="card">
              <strong>{clause.title || 'Clause'}</strong>
              <div style={{ marginTop: 8 }}>
                <small>
                  {(clause.text || '').slice(0, 200)}
                  {(clause.text || '').length > 200 ? '...' : ''}
                </small>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
