import type { CategoryResponse, ItemInput, ItemResponse, NewRatingInput, RatedItemResponse } from '@/api/generated/api'
import type { InterestForm } from '@/components/types'

/** Lowest rating a user can give, inclusive. */
export const MIN_RATING = 0

/** Highest rating a user can give, inclusive. */
export const MAX_RATING = 10

/** Form values for a new interest. */
export const emptyInterestForm: InterestForm = {
  name: '',
  description: '',
  imageUrl: '',
  categoryId: '',
  rating: '',
  notes: '',
  attributeValues: {},
}

/** Fills the form from an existing item and, when the user rated it, their rating. */
export const toInterestForm = (item: ItemResponse, ratedItem?: RatedItemResponse): InterestForm => ({
  name: item.name,
  description: item.description,
  imageUrl: item.imageUrl ?? '',
  categoryId: item.category ? String(item.category.id) : '',
  rating: ratedItem ? String(ratedItem.rating) : '',
  notes: ratedItem?.notes ?? '',
  attributeValues: Object.fromEntries(item.attributes.map((attributeValue) => [attributeValue.attribute.id, attributeValue.value])),
})

/** Builds the items API body, keeping only the filled-in values of the chosen category's attributes. */
export const toItemInput = (form: InterestForm, category: CategoryResponse): ItemInput => ({
  name: form.name,
  description: form.description,
  imageUrl: form.imageUrl || null,
  categoryId: category.id,
  attributeValues: category.attributes
    .filter((attribute) => form.attributeValues[attribute.id])
    .map((attribute) => ({ attributeId: attribute.id, value: form.attributeValues[attribute.id] })),
})

/** Builds the ratings API body that rates the item with id `itemId`. */
export const toRatingInput = (form: InterestForm, itemId: number): NewRatingInput => ({
  item_id: itemId,
  rating: Number(form.rating),
  notes: form.notes,
})

/** Whether the item fields in the form differ from the item as it was loaded, ignoring the rating and notes. */
export const hasItemChanges = (form: InterestForm, loadedForm: InterestForm, category: CategoryResponse): boolean => (
  form.categoryId !== loadedForm.categoryId
  || JSON.stringify(toItemInput(form, category)) !== JSON.stringify(toItemInput(loadedForm, category))
)
