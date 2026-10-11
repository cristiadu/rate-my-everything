/** One row of a rankings table. */
export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url?: string | null;
    /** Collective grade: the average of each user's personal grade of the item. */
    rating: number;
    /** Personal grade of the signed-in user, or null when they have not rated the item. */
    my_rating: number | null;
    /** How many ratings everyone gave the item. */
    rating_count: number;
}

/** Which ratings a rankings page shows: the signed-in user's own, or everyone's averaged per item. */
export enum RankingScope {
    MINE = 'mine',
    ALL = 'all',
}

/** Roles a user can hold; mirrors the API's UserRole enum. */
export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
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

/** Kinds of value an attribute holds; mirrors the API's AttributeValueType enum. */
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
    valueType: AttributeValueType;
}

/** A category with the attributes linked to it. */
export interface Category {
    id: number;
    name: string;
    description?: string | null;
    attributes: Attribute[];
}

/** Values edited in the category form. */
export type CategoryFormValues = {
    name: string;
    description: string;
    attributeIds: number[];
}

/** Values edited in the attribute form. */
export type AttributeFormValues = {
    name: string;
    valueType: AttributeValueType;
}

/** Which attribute form the admin screen shows: none, a new attribute, or an existing attribute being edited. */
export type AttributeEditorState = { mode: 'create' } | { mode: 'edit', attribute: Attribute } | null

/** A value that survives JSON.stringify unchanged. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

/** A JSON object sent as an API request body. */
export type JsonObject = { [key: string]: JsonValue }

/** User claims the API puts in its JWT payload. */
export interface TokenPayload {
    id: number;
    username: string;
    roles: UserRole[];
}

/** One choice in a multiselect dropdown. */
export type SelectOption = {
    value: number;
    label: string;
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

/** One time a user rated an item, returned with the item and its category; a user can rate an item many times. */
export interface RatedItem {
    id: number;
    rating: number;
    notes?: string | null;
    /** Id of the user who gave the rating. */
    userId: number;
    /** When the rating was given, as an ISO 8601 timestamp. */
    ratedAt: string;
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
export type ItemInput = {
    name: string;
    description: string;
    imageUrl: string | null;
    categoryId: number;
    attributeValues: { attributeId: number; value: string }[];
}

/** Rating fields sent to the ratings API. */
export type RatingInput = {
    rating: number;
    notes: string;
}
