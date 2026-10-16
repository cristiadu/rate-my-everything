import {
  AttributeValueType, type AttributeResponse, type CategoryResponse, type GetRatingsParams, type RankingScope,
} from '@/api/generated/api'
import type { InterestFilters } from '@/components/types'

/** Attributes of the chosen categories, each listed once even when several categories share it. */
export const filterAttributes = (categories: CategoryResponse[], categoryIds: number[]): AttributeResponse[] => {
  const attributes = categories.filter((category) => categoryIds.includes(category.id)).flatMap((category) => category.attributes)
  return attributes.filter((attribute, index) => attributes.findIndex((other) => other.id === attribute.id) === index)
}

/**
 * Filters to apply from the ones typed in the panel: keeps only filled-in values of the shown attributes,
 * and a yes/no attribute only when ticked, since an unticked box means "any".
 */
export const toAppliedFilters = (draft: InterestFilters, attributes: AttributeResponse[]): InterestFilters => ({
  ...draft,
  name: draft.name.trim(),
  attributeValues: Object.fromEntries(attributes
    .map((attribute) => [attribute, draft.attributeValues[attribute.id]?.trim() ?? ''] as const)
    .filter(([attribute, value]) => value !== '' && !(attribute.valueType === AttributeValueType.BOOLEAN && value === 'false'))
    .map(([attribute, value]) => [attribute.id, value])),
})

/** Whether any filter is set, so empty results can say nothing matched instead of nothing was rated. */
export const hasFilters = (filters: InterestFilters): boolean => filters.name !== ''
  || filters.categoryIds.length > 0
  || Object.keys(filters.attributeValues).length > 0
  || filters.minGrade !== ''
  || filters.maxGrade !== ''

/** Parameters the ratings API filters by: the scope, plus each filter that is set. */
export const toRatingParams = (filters: InterestFilters, scope: RankingScope): GetRatingsParams => ({
  scope,
  ...(filters.name && { name: filters.name }),
  ...(filters.categoryIds.length > 0 && { categoryId: filters.categoryIds }),
  ...(Object.keys(filters.attributeValues).length > 0 && {
    attribute: Object.entries(filters.attributeValues).map(([attributeId, value]) => `${attributeId}:${value}`),
  }),
  ...(filters.minGrade && { minGrade: Number(filters.minGrade) }),
  ...(filters.maxGrade && { maxGrade: Number(filters.maxGrade) }),
})
