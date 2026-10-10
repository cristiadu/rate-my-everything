export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url: string;
    rating: number;
}

export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
}

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    roles: UserRole[];
}
