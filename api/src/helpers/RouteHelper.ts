import UserRole, { MODERATION_ROLES } from '@/models/UserRole'
import { RouteConfig } from '@/models/RouteConfig'

/** HTTP methods that only read data and so are checked against a route's `roles`. */
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Whether a user with these roles may call the route with this method; routes without roles allow anyone. */
export const canAccessRoute = (route: RouteConfig, method: string, userRoles: UserRole[]): boolean => {
  const allowedRoles = READ_METHODS.has(method) ? route.roles : route.writeRoles ?? route.roles
  return !allowedRoles || allowedRoles.some((role) => userRoles.includes(role))
}

/** Whether a user with these roles may review change requests and change shared interests directly. */
export const canModerate = (userRoles: UserRole[]): boolean => MODERATION_ROLES.some((role) => userRoles.includes(role))
