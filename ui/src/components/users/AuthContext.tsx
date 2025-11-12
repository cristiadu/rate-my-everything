import React, { createContext, useState, useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token)

  useEffect(() => {
    // Check for token on initial load
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
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Create a HOC (Higher Order Component) for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectPath: string = '/login'
) => {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated } = useAuth()
    const location = useLocation()
    
    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
      // Redirect to login page with the return URL in state
      return <Navigate to={redirectPath} state={{ from: location }} replace />
    }
    
    return <Component {...props} />
  }
  
  WithAuthComponent.displayName = `WithAuth(${Component.displayName || Component.name || 'Component'})`
  return WithAuthComponent
}

export default AuthContext