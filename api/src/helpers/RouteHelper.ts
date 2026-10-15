import UserRole, { MODERATION_ROLES } from '@/models/UserRole'

/** Whether a user with these roles may review change requests and change shared interests directly. */
export const canModerate = (userRoles: UserRole[]): boolean => MODERATION_ROLES.some((role) => userRoles.includes(role))
