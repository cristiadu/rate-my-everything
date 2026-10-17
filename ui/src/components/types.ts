import {
  UserRole, type AttributeResponse, type CategoryResponse, type RatedItemResponse, type UserResponse,
} from '@/api/generated/api'

/** Roles that may review change requests and change shared interests directly; mirrors the API's MODERATION_ROLES. */
export const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

/** Minimum password length, in characters, accepted by the user forms. */
export const MIN_PASSWORD_LENGTH = 6

/** Length of an ISO 4217 currency code, such as USD. */
export const CURRENCY_CODE_LENGTH = 3

/** Longest comment body the comments API accepts, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** Filters that keep every interest. */
export const NO_INTEREST_FILTERS: InterestFilters = {
    name: '', categoryIds: [], attributeValues: {}, minGrade: '', maxGrade: '',
}

/**
 * One row of a rankings table: a rated item with its collective grade, the average of each user's personal grade,
 * joined with the signed-in user's own grade and how many ratings everyone gave it.
 */
export type RankingItem = Pick<RatedItemResponse, 'item' | 'rating'> & {
    /** Personal grade of the signed-in user, or null when they have not rated the item. */
    myRating: RatedItemResponse['rating'] | null;
    ratingCount: number;
}

/** Bulma color of a grade box: green for good grades, yellow for average ones, red for bad ones and grey when there is no grade. */
export type GradeColor = 'success' | 'warning' | 'danger' | 'light'

/** Whose ratings an interest's rating history lists: the signed-in user's own, or everyone's. */
export type RatingHistoryScope = 'personal' | 'all'

/** Which user form the admin screen shows: none, a new user, or an existing user being edited. */
export type UserEditorState = { mode: 'create' } | { mode: 'edit', user: UserResponse } | null

/** Outcome message shown after an admin action. */
export type StatusMessage = { message: string, isSuccess: boolean } | null

/** Which attribute form the admin screen shows: none, a new attribute, or an existing attribute being edited. */
export type AttributeEditorState = { mode: 'create' } | { mode: 'edit', attribute: AttributeResponse } | null

/** How the input for one attribute value type looks: its HTML input type, number step and minimum, and the unit after it. */
export type AttributeInputShape = {
    type: string;
    step?: string;
    min?: string;
    unit?: string;
}

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

/** Categories and attributes used to show change requests with names instead of ids. */
export type ChangeRequestLookups = {
    categories: CategoryResponse[];
    attributes: AttributeResponse[];
}

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
