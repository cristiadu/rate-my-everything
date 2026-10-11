import { CategoryInput } from '@/models/Category'

/** Checks that attributeIds from a request body is either absent or an array of integers. */
export const isValidAttributeIds = (attributeIds: CategoryInput['attributeIds']): boolean => attributeIds === undefined
  || (Array.isArray(attributeIds) && attributeIds.every((id) => Number.isInteger(id)))
