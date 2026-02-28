import React, { createContext, useState } from 'react'
import * as clauseApi from '../api/clauseApi'

export const ClauseContext = createContext(null)

export function ClauseProvider({ children }) {
  const [results, setResults] = useState([])

  const search = async (query) => {
    const res = await clauseApi.searchClauses(query)
    setResults(res)
    return res
  }

  return <ClauseContext.Provider value={{ results, search }}>{children}</ClauseContext.Provider>
}
