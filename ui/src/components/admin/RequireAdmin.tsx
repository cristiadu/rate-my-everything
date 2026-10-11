import React from 'react'
import { useAuth } from '@/components/users/AuthContext'
import { TokenPayload, UserRole } from '@/components/types'

/** Reads the user claims from the JWT payload; the API still enforces them on every request. */
const readTokenPayload = (token: string | null): Partial<TokenPayload> => {
  if (!token) return {}
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

/** Reads the roles from the JWT payload; the API still enforces them on every request. */
export const getRolesFromToken = (token: string | null): UserRole[] => {
  const { roles } = readTokenPayload(token)
  return Array.isArray(roles) ? roles : []
}

/** Reads the username from the JWT payload. */
export const getUsernameFromToken = (token: string | null): string => readTokenPayload(token).username ?? ''

/** Renders its children only for logged-in users, and asks everyone else to log in. */
export const RequireLogin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="notification is-warning">Please log in to access this page.</div>
    )
  }

  return <>{children}</>
}

/** Renders its children only for logged-in admins, and an explanation for everyone else. */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth()

  return (
    <RequireLogin>
      {getRolesFromToken(token).includes(UserRole.ADMIN) ? children : (
        <div className="notification is-danger">You do not have permission to access the administration area.</div>
      )}
    </RequireLogin>
  )
}

export default RequireAdmin
