import React, { createContext, useState, useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import UserRole from '@api/models/UserRole'

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  roles: UserRole[];
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  roles: [],
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

/** Reads the roles from the JWT payload; the API still enforces them on every request. */
export const getRolesFromToken = (token: string | null): UserRole[] => {
  if (!token) return []
  try {
    const payload: { roles?: UserRole[] } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return Array.isArray(payload.roles) ? payload.roles : []
  } catch {
    return []
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token)

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken)
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, roles: getRolesFromToken(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectPath: string = '/login'
) => {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated } = useAuth()
    const location = useLocation()
    
    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
      return <Navigate to={redirectPath} state={{ from: location }} replace />
    }
    
    return <Component {...props} />
  }
  
  WithAuthComponent.displayName = `WithAuth(${Component.displayName || Component.name || 'Component'})`
  return WithAuthComponent
}

export default AuthContext