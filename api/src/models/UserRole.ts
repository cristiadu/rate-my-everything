enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
}

/** Roles that may review change requests and change shared interests directly. */
export const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

export default UserRole
