export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url: string;
    rating: number;
}

/** Roles a signed-in user can hold, as issued in the JWT. */
export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
}

/** Kinds of value an attribute holds. */
export enum AttributeValueType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
}

/** An attribute that categories can use to describe their items. */
export interface Attribute {
    id: number;
    name: string;
    valueType: string;
}

/** A category with the attributes linked to it. */
export interface Category {
    id: number;
    name: string;
    description?: string | null;
    attributes: Attribute[];
}

/** Values edited in the category form. */
export interface CategoryForm {
    name: string;
    description: string;
    attributeIds: number[];
}

/** Values edited in the attribute form. */
export interface AttributeForm {
    name: string;
    valueType: string;
}

/** Claims the UI reads from the JWT payload. */
export interface TokenPayload {
    roles?: UserRole[];
}
