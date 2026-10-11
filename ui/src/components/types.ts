import UserRole from '@api/models/UserRole'

/** Roles a user can hold; the API's own enum, re-exported so UI code imports it from here. */
export { UserRole }

export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url: string;
    rating: number;
}


/** A user as returned by the admin users API, without a password. */
export interface AdminUser {
    id: number;
    username: string;
    email: string;
    roles: UserRole[];
}

/** Minimum password length, in characters, accepted by the user forms. */
export const MIN_PASSWORD_LENGTH = 6

/** Values edited in the admin user form; an empty password means "keep the current one" when editing. */
export type UserFormValues = {
    username: string;
    email: string;
    password: string;
    roles: UserRole[];
}

/** Which user form the admin screen shows: none, a new user, or an existing user being edited. */
export type UserEditorState = { mode: 'create' } | { mode: 'edit', user: AdminUser } | null

/** Outcome message shown after an admin action. */
export type StatusMessage = { message: string, isSuccess: boolean } | null
