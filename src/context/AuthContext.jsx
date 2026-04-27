import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/client.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((token, u) => {
    localStorage.setItem('token', token)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}

export function dashboardPathForRole(role) {
  switch (role) {
    case 'super_admin':
      return '/admin'
    case 'president':
      return '/president'
    case 'vice_president':
      return '/vp'
    case 'coordinator':
      return '/coordinator'
    case 'captain':
    case 'vice_captain':
    case 'member':
    default:
      return '/me'
  }
}
