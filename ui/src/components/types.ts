import type React from 'react'
import type UserRole from '@/components/users/UserRole'

export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url: string;
    rating: number;
}

/** The signed-in user, as carried in the API's JWT. */
export interface SessionUser {
    id: number;
    username: string;
    roles: UserRole[];
}

/** Claims the API puts in its JWT payload; `exp` is the expiry in seconds since the epoch. */
export interface JwtClaims extends SessionUser {
    exp?: number;
}

/** Props for AccessMessage: a heading and the explanation shown under it. */
export interface AccessMessageProps {
    title: string;
    children: React.ReactNode;
}

/** Props for the RequireAuth route guard; `roles` lists the roles allowed in, any one of them is enough. */
export interface RequireAuthProps {
    children: React.ReactNode;
    roles?: UserRole[];
}
