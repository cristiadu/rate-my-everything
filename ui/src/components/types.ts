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

/** Roles that may review change requests and change shared interests directly; mirrors the API's MODERATION_ROLES. */
export const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

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

/** Kind of shared data a change request proposes to change; mirrors the API's ChangeRequestTarget enum. */
export enum ChangeRequestTarget {
    ITEM = 'item',
    CATEGORY = 'category',
}

/** What a change request proposes to do with its target; mirrors the API's ChangeRequestAction enum. */
export enum ChangeRequestAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}

/** Where a change request is in moderation; mirrors the API's ChangeRequestStatus enum. */
export enum ChangeRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

/** The user who submitted or reviewed a change request. */
export interface ChangeRequestUser {
/** Longest comment body the comments API accepts, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** Author of a comment; the API only returns their id and username. */
export type CommentAuthor = {
    id: number;
    username: string;
}

/** Fields a change request proposes, in the shape the items or categories API accepts. */
export type ChangeRequestChanges = Partial<ItemInput> | Partial<CategoryFormValues>

/** A user's proposed change to an interest or category, applied once a moderator approves it. */
export interface ChangeRequest {
    id: number;
    targetType: ChangeRequestTarget;
    action: ChangeRequestAction;
    targetId: number | null;
    targetName: string | null;
    changes: ChangeRequestChanges | null;
    status: ChangeRequestStatus;
    requestedBy: ChangeRequestUser;
    reviewedBy: ChangeRequestUser | null;
    reviewNote: string | null;
    createdAt: string;
    reviewedAt: string | null;
}

/** Body sent to the change requests API. */
export type ChangeRequestInput = {
    targetType: ChangeRequestTarget;
    action: ChangeRequestAction;
    targetId?: number;
    changes?: ItemInput | CategoryFormValues;
}

/** Categories and attributes used to show change requests with names instead of ids. */
export type ChangeRequestLookups = {
    categories: Category[];
    attributes: Attribute[];
}

/** A moderator's decision on a pending change request. */
export type ReviewDecision = ChangeRequestStatus.APPROVED | ChangeRequestStatus.REJECTED
/** One message in the discussion thread of an interest. */
export interface Comment {
    id: number;
    body: string;
    createdAt: string;
    user: CommentAuthor;
}

/** Records the API found for one similar-name query, kept with that query so stale answers can be ignored. */
export type SimilarRecordsLookup<T> = {
    query: string;
    records: T[];
}
