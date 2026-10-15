import type { Request } from 'express'
import { AttributeFilter, MAX_GRADE, MIN_GRADE, RatingFilters } from '@/models/RatedItem'
import RankingScope from '@/models/RankingScope'
import { InvalidQueryParameter } from '@/errors/InvalidQueryParameter'

/** Separates the attribute id from the value in an `attribute` query parameter, as in `attribute=3:Frank Herbert`. */
const ATTRIBUTE_FILTER_SEPARATOR = ':'

/** Every text value of a query parameter, so a parameter sent once or many times reads the same. */
const queryValues = (value: Request['query'][string]): string[] => (Array.isArray(value) ? value : [value])
  .filter((text): text is string => typeof text === 'string')

/** Reads an integer id, failing with the parameter name when the text is not one. */
const parseId = (parameter: string, text: string): number => {
  const id = Number(text)
  if (text.trim() === '' || !Number.isInteger(id)) {
    throw new InvalidQueryParameter(parameter, 'an integer')
  }
  return id
}

/** Reads an optional grade bound, failing when it is not a number within the rating scale. */
const parseGrade = (parameter: string, value: Request['query'][string]): number | undefined => {
  const [text] = queryValues(value)
  if (text === undefined) {
    return undefined
  }
  const grade = Number(text)
  if (text.trim() === '' || Number.isNaN(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    throw new InvalidQueryParameter(parameter, `a number from ${MIN_GRADE} to ${MAX_GRADE}`)
  }
  return grade
}

/** Reads an `attribute` query parameter given as `<attributeId>:<value>`. */
const parseAttributeFilter = (text: string): AttributeFilter => {
  const separatorIndex = text.indexOf(ATTRIBUTE_FILTER_SEPARATOR)
  const value = separatorIndex < 0 ? '' : text.slice(separatorIndex + 1)
  if (value.trim() === '') {
    throw new InvalidQueryParameter('attribute', 'an attribute id and a value, as in 3:Frank Herbert')
  }
  return { attributeId: parseId('attribute', text.slice(0, separatorIndex)), value: value.trim() }
}

/** Reads the scope, which defaults to everyone's ratings. */
const parseScope = (value: Request['query'][string]): RankingScope => {
  const [text = RankingScope.ALL] = queryValues(value)
  const scope = Object.values(RankingScope).find((rankingScope) => rankingScope === text)
  if (!scope) {
    throw new InvalidQueryParameter('scope', `one of: ${Object.values(RankingScope).join(', ')}`)
  }
  return scope
}

/**
 * Reads the rating filters from a request's query parameters: name, categoryId (repeatable), attribute (repeatable,
 * as `<attributeId>:<value>`), minGrade, maxGrade and scope. Throws InvalidQueryParameter for a value it cannot use.
 */
export const parseRatingFilters = (query: Request['query']): RatingFilters => {
  const [name = ''] = queryValues(query.name)
  return {
    name: name.trim() || undefined,
    categoryIds: queryValues(query.categoryId).map((text) => parseId('categoryId', text)),
    attributes: queryValues(query.attribute).map(parseAttributeFilter),
    minGrade: parseGrade('minGrade', query.minGrade),
    maxGrade: parseGrade('maxGrade', query.maxGrade),
    scope: parseScope(query.scope),
  }
}
