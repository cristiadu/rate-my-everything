import React from 'react'
import { useAuth } from '@/components/users/AuthContext'
import { UserRole, type SessionUser } from '@/api/generated/api'
import { MODERATION_ROLES } from '@/components/types'

/** Reads the user claims from the JWT payload; the API still enforces them on every request. */
const readTokenPayload = (token: string | null): Partial<SessionUser> => {
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

/** Reads the user id from the JWT payload, or null when there is no valid token. */
export const getUserIdFromToken = (token: string | null): number | null => readTokenPayload(token).id ?? null

/** Reads the username from the JWT payload. */
export const getUsernameFromToken = (token: string | null): string => readTokenPayload(token).username ?? ''

/** Whether the token's roles let its user review change requests and change shared interests directly. */
export const canModerate = (token: string | null): boolean => {
  const roles = getRolesFromToken(token)
  return MODERATION_ROLES.some((role) => roles.includes(role))
}

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

/** Renders its children only for logged-in admins and moderators, and an explanation for everyone else. */
export const RequireModerator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth()

  return (
    <RequireLogin>
      {canModerate(token) ? children : (
        <div className="notification is-danger">You do not have permission to review change requests.</div>
      )}
    </RequireLogin>
  )
}

export default RequireAdmin
