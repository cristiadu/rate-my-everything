import type { AttributeFilter, RatingFilters, RatingQuery } from '@/models/RatedItem'
import RankingScope from '@/models/RankingScope'
import ErrorCode from '@/errors/ErrorCode'
import { NewApiError } from '@/models/APIError'
import { RequestRejected } from '@/errors/RequestRejected'

/** Separates the attribute id from the value in an `attribute` query parameter, as in `attribute=3:Frank Herbert`. */
const ATTRIBUTE_FILTER_SEPARATOR = ':'

/** Reads an `attribute` query parameter given as `<attributeId>:<value>`, rejecting the request when it is not one. */
const parseAttributeFilter = (text: string): AttributeFilter => {
  const separatorIndex = text.indexOf(ATTRIBUTE_FILTER_SEPARATOR)
  const idText = text.slice(0, Math.max(separatorIndex, 0))
  const attributeId = Number(idText)
  const value = separatorIndex < 0 ? '' : text.slice(separatorIndex + 1).trim()
  if (idText.trim() === '' || !Number.isInteger(attributeId) || value === '') {
    throw new RequestRejected(NewApiError(
      ErrorCode.VALIDATION_ERROR, 400, `Invalid attribute filter "${text}": it must be an attribute id and a value, as in 3:Frank Herbert`,
    ))
  }
  return { attributeId, value }
}

/**
 * Turns the ratings list's query parameters, already type-checked by the generated routes, into the filters the
 * service applies. A missing scope means everyone's ratings.
 */
export const parseRatingFilters = (query: RatingQuery): RatingFilters => ({
  name: query.name?.trim() || undefined,
  categoryIds: query.categoryId ?? [],
  attributes: (query.attribute ?? []).map(parseAttributeFilter),
  minGrade: query.minGrade,
  maxGrade: query.maxGrade,
  scope: query.scope ?? RankingScope.ALL,
})
