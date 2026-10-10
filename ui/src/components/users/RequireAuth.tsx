import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/users/AuthContext'
import NotAuthorized from '@/components/users/NotAuthorized'
import type { RequireAuthProps } from '@/components/types'

/** Route guard: sends signed-out users to /login and shows NotAuthorized when the user lacks the required role. */
const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !hasRole(...roles)) {
    return <NotAuthorized />
  }

  return <>{children}</>
}

export default RequireAuth
