import {
  AttributeValueType, type Attribute, type Category, type InterestFilters, type RankingScope,
} from '@/components/types'

/** Attributes of the chosen categories, each listed once even when several categories share it. */
export const filterAttributes = (categories: Category[], categoryIds: number[]): Attribute[] => {
  const attributes = categories.filter((category) => categoryIds.includes(category.id)).flatMap((category) => category.attributes)
  return attributes.filter((attribute, index) => attributes.findIndex((other) => other.id === attribute.id) === index)
}

/**
 * Filters to apply from the ones typed in the panel: keeps only filled-in values of the shown attributes,
 * and a yes/no attribute only when ticked, since an unticked box means "any".
 */
export const toAppliedFilters = (draft: InterestFilters, attributes: Attribute[]): InterestFilters => ({
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

/** Query string the ratings API filters by: the scope, then each filter that is set, as the API's query parameters. */
export const toRatingQuery = (filters: InterestFilters, scope: RankingScope): string => {
  const params = new URLSearchParams({ scope })
  if (filters.name) {
    params.append('name', filters.name)
  }
  filters.categoryIds.forEach((categoryId) => params.append('categoryId', String(categoryId)))
  Object.entries(filters.attributeValues).forEach(([attributeId, value]) => params.append('attribute', `${attributeId}:${value}`))
  if (filters.minGrade) {
    params.append('minGrade', filters.minGrade)
  }
  if (filters.maxGrade) {
    params.append('maxGrade', filters.maxGrade)
  }
  return params.toString()
}
