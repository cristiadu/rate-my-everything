import { AttributeValueType, ImportSource, UserRole } from '@/api/generated/api'
import type {
    AttributeResponse, CategoryResponse, CommentResponse, ItemAttributeValue, ItemResponse, RatedItemResponse, SessionUser, UserResponse,
} from '@/api/generated/api'

export { AttributeValueType, ImportSource, UserRole } from '@/api/generated/api'
export type { ImportedItem, ItemInput, RatingInput, UserInput } from '@/api/generated/api'

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

/** A user as returned by the admin users API, without a password. */
export type AdminUser = UserResponse

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

/** An attribute that categories can use to describe their items. */
export type Attribute = AttributeResponse

/** A category with the attributes linked to it. */
export type Category = CategoryResponse

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

/** User claims the API puts in its JWT payload. */
export type TokenPayload = SessionUser

/** One choice in a multiselect dropdown. */
export type SelectOption = {
    value: number;
    label: string;
}

/** A value an item holds for one attribute of its category. */
export type AttributeValue = ItemAttributeValue

/** An interest people rate, with its category and the values of that category's attributes. */
export type Item = ItemResponse

/** One time a user rated an item, returned with the item and its category; a user can rate an item many times. */
export type RatedItem = RatedItemResponse

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

/** How each import source is named, and what its search box asks for. */
export const IMPORT_SOURCES: Record<ImportSource, { label: string, queryLabel: string }> = {
    [ImportSource.LASTFM]: { label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
    [ImportSource.YOUTUBE]: { label: 'YouTube', queryLabel: 'Video or playlist URL' },
}

/** Longest comment body the comments API accepts, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** One message in the discussion thread of an interest. */
export type Comment = CommentResponse

/** Records the API found for one similar-name query, kept with that query so stale answers can be ignored. */
export type SimilarRecordsLookup<T> = {
    query: string;
    records: T[];
}
