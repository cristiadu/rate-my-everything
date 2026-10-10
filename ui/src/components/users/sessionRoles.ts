import { useAuth } from '@/components/users/AuthContext'

// Reads the roles claim from the JWT payload. This is only used to decide what to show;
// the API still enforces permissions on every request.
export const getTokenRoles = (token: string | null): string[] => {
  const payload = token?.split('.')[1]
  if (!payload) {
    return []
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const { roles } = JSON.parse(atob(base64)) as { roles?: unknown }
    return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : []
  } catch {
    return []
  }
}

export const useIsAdmin = (): boolean => {
  const { token } = useAuth()
  return getTokenRoles(token).includes('admin')
}
