import {
  AttributeValueType, ChangeRequestStatus, ImportSource, UserRole, type AttributeResponse, type CategoryResponse,
  type UserResponse,
} from '@/api/generated/api'

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

/** Roles that may review change requests and change shared interests directly; mirrors the API's MODERATION_ROLES. */
export const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

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
export type UserEditorState = { mode: 'create' } | { mode: 'edit', user: UserResponse } | null

/** Outcome message shown after an admin action. */
export type StatusMessage = { message: string, isSuccess: boolean } | null

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
export type AttributeEditorState = { mode: 'create' } | { mode: 'edit', attribute: AttributeResponse } | null

/** One choice in a multiselect dropdown. */
export type SelectOption = {
    value: number;
    label: string;
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

/** How each import source is named, and what its search box asks for. */
export const IMPORT_SOURCES: Record<ImportSource, { label: string, queryLabel: string }> = {
    [ImportSource.LASTFM]: { label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
    [ImportSource.YOUTUBE]: { label: 'YouTube', queryLabel: 'Video or playlist URL' },
}

/** Longest comment body the comments API accepts, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** Categories and attributes used to show change requests with names instead of ids. */
export type ChangeRequestLookups = {
    categories: CategoryResponse[];
    attributes: AttributeResponse[];
}

/** A moderator's decision on a pending change request. */
export type ReviewDecision = ChangeRequestStatus.APPROVED | ChangeRequestStatus.REJECTED

/** Records the API found for one similar-name query, kept with that query so stale answers can be ignored. */
export type SimilarRecordsLookup<T> = {
    query: string;
    records: T[];
}

/**
 * Filters chosen in the filter panel. Attribute values are keyed by attribute id; grades are kept as typed, and an
 * empty text means no filter.
 */
export interface InterestFilters {
    name: string;
    categoryIds: number[];
    attributeValues: Record<number, string>;
    minGrade: string;
    maxGrade: string;
}

/** Filters that keep every interest. */
export const NO_INTEREST_FILTERS: InterestFilters = {
    name: '', categoryIds: [], attributeValues: {}, minGrade: '', maxGrade: '',
}
