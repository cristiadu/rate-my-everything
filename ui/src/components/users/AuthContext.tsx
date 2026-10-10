import React, { createContext, useState, useContext } from 'react'
import type { JwtClaims, SessionUser } from '@/components/types'
import UserRole from '@/components/users/UserRole'

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: SessionUser | null;
  hasRole: (...roles: UserRole[]) => boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  hasRole: () => false,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

/** localStorage key that holds the JWT. */
const TOKEN_KEY = 'authToken'

/** Milliseconds per second, to compare the JWT's `exp` (seconds) with Date.now() (milliseconds). */
const MS_PER_SECOND = 1000

/**
 * Reads the user from the JWT payload, or returns null for a malformed or expired token.
 * The API checks the signature on every request, so the UI only uses the claims to decide what to show.
 */
export const decodeToken = (token: string): SessionUser | null => {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims: JwtClaims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))

    if (typeof claims.exp === 'number' && claims.exp * MS_PER_SECOND <= Date.now()) {
      return null
    }
    if (typeof claims.id !== 'number' || typeof claims.username !== 'string' || !Array.isArray(claims.roles)) {
      return null
    }

    return { id: claims.id, username: claims.username, roles: claims.roles }
  } catch {
    return null
  }
}

/** Returns the stored token, clearing it first if it is no longer usable. */
const readStoredToken = (): string | null => {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  if (storedToken && !decodeToken(storedToken)) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return storedToken
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readStoredToken)
  const user = token ? decodeToken(token) : null

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const hasRole = (...roles: UserRole[]) => !!user && roles.some((role) => user.roles.includes(role))

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, token, user, hasRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
