/** One row of a rankings table. */
export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url?: string | null;
    rating: number;
}

/** Which ratings a rankings page shows: the signed-in user's own, or everyone's averaged per item. */
export enum RankingScope {
    MINE = 'mine',
    ALL = 'all',
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

/** A value an item holds for one attribute of its category. */
export interface AttributeValue {
    id: number;
    attribute: Attribute;
    value: string;
}

/** An interest people rate, with its category and the values of that category's attributes. */
export interface Item {
    id: number;
    name: string;
    description: string;
    imageUrl?: string | null;
    category: Omit<Category, 'attributes'> | null;
    attributes: AttributeValue[];
}

/** One user's rating of an item, returned with the item and its category. */
export interface RatedItem {
    id: number;
    rating: number;
    notes?: string | null;
    item: Omit<Item, 'attributes'>;
}

/** Values edited in the interest form; attribute values are keyed by attribute id. */
export interface InterestForm {
    name: string;
    description: string;
    imageUrl: string;
    categoryId: string;
    rating: string;
    notes: string;
    attributeValues: Record<number, string>;
}

/** Item fields sent to the items API, with attribute values given by attribute id. */
export interface ItemInput {
    name: string;
    description: string;
    imageUrl: string | null;
    categoryId: number;
    attributeValues: { attributeId: number; value: string }[];
}

/** Rating fields sent to the ratings API. */
export interface RatingInput {
    rating: number;
    notes: string;
}
