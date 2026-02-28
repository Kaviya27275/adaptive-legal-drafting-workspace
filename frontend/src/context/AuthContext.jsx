import React, { createContext, useEffect, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/authApi'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const rawUser = localStorage.getItem('lexora_current_user')
    if (token && rawUser) {
      try {
        setUser(JSON.parse(rawUser))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    if (res.token) {
      localStorage.setItem('token', res.token)
      const nextUser = res.user || { email }
      localStorage.setItem('lexora_current_user', JSON.stringify(nextUser))
      setUser(nextUser)
      return true
    }
    return false
  }

  const logout = async () => {
    await apiLogout()
    localStorage.removeItem('token')
    localStorage.removeItem('lexora_current_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
