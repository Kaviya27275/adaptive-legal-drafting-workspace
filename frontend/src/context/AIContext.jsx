import React, { createContext } from 'react'
import * as aiApi from '../api/aiApi'

export const AIContext = createContext(null)

export function AIProvider({ children }) {
  const suggest = async (text, mode = 'edit') => {
    const res = await aiApi.suggest(text, mode)
    return res
  }

  return <AIContext.Provider value={{ suggest }}>{children}</AIContext.Provider>
}
