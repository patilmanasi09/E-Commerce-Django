import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, if we have a token, ask the backend who we are.
  // This is what makes a page refresh keep you logged in.
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/users/profile/')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/users/login/', { email, password })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  async function register(name, email, password, confirm_password) {
    const { data } = await api.post('/users/register/', {
      name,
      email,
      password,
      confirm_password,
    })
    return data
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  async function refreshProfile() {
    const { data } = await api.get('/users/profile/')
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
