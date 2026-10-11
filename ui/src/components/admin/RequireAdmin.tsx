import React from 'react'
import { useAuth } from '@/components/users/AuthContext'
import UserRole from '@api/models/UserRole'

/** Renders its children only for logged-in admins, and an explanation for everyone else. */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, roles } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="notification is-warning">Please log in to access the administration area.</div>
    )
  }

  if (!roles.includes(UserRole.ADMIN)) {
    return (
      <div className="notification is-danger">You do not have permission to access the administration area.</div>
    )
  }

  return <>{children}</>
}

export default RequireAdmin
