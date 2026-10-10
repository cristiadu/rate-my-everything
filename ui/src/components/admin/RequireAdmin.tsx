import React from 'react'
import { useAuth } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'

// Reads the roles from the JWT payload; the API still enforces them on every request
export const getRolesFromToken = (token: string | null): UserRole[] => {
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return Array.isArray(payload.roles) ? payload.roles : []
  } catch {
    return []
  }
}

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="notification is-warning">Please log in to access the administration area.</div>
    )
  }

  if (!getRolesFromToken(token).includes(UserRole.ADMIN)) {
    return (
      <div className="notification is-danger">You do not have permission to access the administration area.</div>
    )
  }

  return <>{children}</>
}

export default RequireAdmin
