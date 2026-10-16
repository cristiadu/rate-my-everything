enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
}

/** Roles that may review change requests and change shared interests directly. */
export const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

/** Roles a user holds once implied roles are added: a moderator is a user who can also moderate. */
export const withImpliedRoles = (roles: UserRole[]): UserRole[] => (
  roles.includes(UserRole.MODERATOR) && !roles.includes(UserRole.USER) ? [...roles, UserRole.USER] : roles
)

export default UserRole
