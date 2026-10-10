import { useAuth } from '@/components/users/AuthContext'
import { UserRole, type TokenPayload } from '@/components/types'

/**
 * Whether the signed-in user has the admin role, read from the JWT payload.
 * Only used to decide what to show; the API still enforces permissions on every request.
 */
export const useIsAdmin = (): boolean => {
  const { token } = useAuth()
  const payload = token?.split('.')[1]
  if (!payload) {
    return false
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const { roles } = JSON.parse(atob(base64)) as TokenPayload
    return Array.isArray(roles) && roles.includes(UserRole.ADMIN)
  } catch {
    return false
  }
}
