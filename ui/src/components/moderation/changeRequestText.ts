import {
  type Attribute, type Category, type CategoryFormValues, type ChangeRequest, ChangeRequestAction, type ChangeRequestChanges,
  type ChangeRequestLookups, ChangeRequestStatus, ChangeRequestTarget, type ItemInput,
} from '@/components/types'

/** Verb shown for each proposed action. */
const ACTION_LABELS: Record<ChangeRequestAction, string> = {
  [ChangeRequestAction.CREATE]: 'Add',
  [ChangeRequestAction.UPDATE]: 'Edit',
  [ChangeRequestAction.DELETE]: 'Remove',
}

/** Noun shown for each kind of target. */
const TARGET_LABELS: Record<ChangeRequestTarget, string> = {
  [ChangeRequestTarget.ITEM]: 'interest',
  [ChangeRequestTarget.CATEGORY]: 'category',
}

/** Bulma tag color for each status. */
export const STATUS_TAG_CLASSES: Record<ChangeRequestStatus, string> = {
  [ChangeRequestStatus.PENDING]: 'is-warning',
  [ChangeRequestStatus.APPROVED]: 'is-success',
  [ChangeRequestStatus.REJECTED]: 'is-danger',
}

/** One sentence naming what a change request proposes, such as `Edit interest "Dune"`. */
export const describeChangeRequest = ({ action, targetType, targetName }: ChangeRequest): string => (
  `${ACTION_LABELS[action]} ${TARGET_LABELS[targetType]} "${targetName ?? ''}"`
)

/** Shown for a list field that was emptied, such as a category with all its attributes removed. */
const EMPTY_LIST_TEXT = 'None'

/** Name of an attribute by id, or its id when it no longer exists. */
const attributeName = (attributes: Attribute[], attributeId: number): string => (
  attributes.find((attribute) => attribute.id === attributeId)?.name ?? `#${attributeId}`
)

/** Name of a category by id, or its id when it no longer exists. */
const categoryName = (categories: Category[], categoryId: number): string => (
  categories.find((category) => category.id === categoryId)?.name ?? `#${categoryId}`
)

/** The proposed fields as label and readable value pairs, in a stable order, skipping fields that were not sent. */
export const listChanges = (
  changes: ChangeRequestChanges | null, { categories, attributes }: ChangeRequestLookups,
): [string, string][] => {
  if (!changes) {
    return []
  }
  const { name, description } = changes
  const { imageUrl, categoryId, attributeValues } = changes as Partial<ItemInput>
  const { attributeIds } = changes as Partial<CategoryFormValues>
  const rows: [string, string | null | undefined][] = [
    ['Name', name],
    ['Description', description],
    ['Image URL', imageUrl],
    ['Category', categoryId === undefined ? undefined : categoryName(categories, categoryId)],
    ['Details', attributeValues && (
      attributeValues.map(({ attributeId, value }) => `${attributeName(attributes, attributeId)}: ${value}`).join(', ') || EMPTY_LIST_TEXT
    )],
    ['Attributes', attributeIds && (
      attributeIds.map((attributeId) => attributeName(attributes, attributeId)).join(', ') || EMPTY_LIST_TEXT
    )],
  ]
  return rows.filter((row): row is [string, string] => row[1] !== undefined && row[1] !== null)
}
