import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/users/AuthContext'
import AccessMessage from '@/components/users/AccessMessage'
import type { RequireAuthProps } from '@/components/types'

/** Route guard: asks signed-out visitors to log in with the header form, and blocks users without the required role. */
const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated) {
    return (
      <AccessMessage title="Log in required">
        Log in with the form at the top of the page to see this page.
      </AccessMessage>
    )
  }

  if (roles && !hasRole(...roles)) {
    return (
      <AccessMessage title="Not authorized">
        You do not have permission to view this page. <Link to="/">Go back home</Link>.
      </AccessMessage>
    )
  }

  return <>{children}</>
}

export default RequireAuth
