import { CategoryInput } from '@/models/Category'
import { ItemInput } from '@/models/Item'
import { ChangeRequestChanges, ChangeRequestInput, SUPPORTED_ACTIONS } from '@/models/ChangeRequest'
import ChangeRequestAction from '@/models/ChangeRequestAction'
import ChangeRequestTarget from '@/models/ChangeRequestTarget'
import { isValidAttributeIds } from '@/helpers/CategoryHelper'

/** Whether the value is one of the ChangeRequestTarget values. */
const isChangeRequestTarget = (targetType: string): targetType is ChangeRequestTarget => (
  Object.values<string>(ChangeRequestTarget).includes(targetType)
)

/** Returns why a submitted change request is invalid, or null when it can be saved. */
export const findChangeRequestError = ({ targetType, action, targetId, changes }: ChangeRequestInput): string | null => {
  if (!isChangeRequestTarget(targetType)) {
    return `targetType must be one of: ${Object.values(ChangeRequestTarget).join(', ')}`
  }
  if (!SUPPORTED_ACTIONS[targetType].includes(action)) {
    return `action for ${targetType} must be one of: ${SUPPORTED_ACTIONS[targetType].join(', ')}`
  }
  if (action !== ChangeRequestAction.CREATE && !Number.isInteger(targetId)) {
    return 'targetId must be an integer'
  }
  if (action === ChangeRequestAction.DELETE) {
    return null
  }
  if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
    return 'changes must be an object'
  }
  if (targetType === ChangeRequestTarget.CATEGORY) {
    const categoryChanges = changes as CategoryInput
    if (action === ChangeRequestAction.CREATE && !categoryChanges.name) {
      return 'Missing required field: changes.name'
    }
    if (!isValidAttributeIds(categoryChanges.attributeIds)) {
      return 'attributeIds must be an array of integers'
    }
  }
  return null
}

/** Keeps only the fields the items or categories API accepts, so nothing else is stored or applied later. */
export const pickChanges = (targetType: ChangeRequestTarget, changes: ChangeRequestChanges | undefined): ChangeRequestChanges | null => {
  if (!changes) {
    return null
  }
  if (targetType === ChangeRequestTarget.ITEM) {
    const { name, description, imageUrl, categoryId, attributeValues } = changes as ItemInput
    return { name, description, imageUrl, categoryId, attributeValues }
  }
  const { name, description, attributeIds } = changes as CategoryInput
  return { name, description, attributeIds }
}
