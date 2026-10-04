import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authService, licenseService } from '../services/api'
import useIdleLogout, { markActivity } from '../hooks/useIdleLogout'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [license, setLicense] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadLicense = useCallback(async () => {
    try {
      const { data } = await licenseService.getState()
      setLicense(data)
    } catch {
      // Sin estado no se muestra aviso: el 402 de cualquier pedido igual lo trae.
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      authService.getProfile()
        .then(() => loadLicense())
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [loadLicense])

  // Un 402 en cualquier pantalla trae el estado de la licencia bloqueada.
  useEffect(() => {
    const onBlocked = (event) => { if (event.detail) setLicense(event.detail) }
    window.addEventListener('license:blocked', onBlocked)
    return () => window.removeEventListener('license:blocked', onBlocked)
  }, [])

  const login = async (username, password, tenantEmail) => {
    const response = await authService.login(username, password, tenantEmail)
    const { token, user: userData } = response.data
    if (userData.role === 'SuperAdmin') {
      const err = new Error('La app es para los equipos de cada empresa. Entrá al panel desde la consola web.')
      err.response = { data: { error: err.message } }
      throw err
    }
    markActivity()
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    await loadLicense()
    return userData
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setLicense(null)
  }, [])

  useIdleLogout(Boolean(user), logout)

  const isAdmin = () => user?.role === 'Admin'

  return (
    <AuthContext.Provider value={{ user, license, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
