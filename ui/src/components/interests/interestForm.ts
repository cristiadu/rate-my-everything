import type {
  Category, InterestForm, Item, ItemInput, RatedItem, RatingInput,
} from '@/components/types'

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
export const toInterestForm = (item: Item, ratedItem?: RatedItem): InterestForm => ({
  name: item.name,
  description: item.description,
  imageUrl: item.imageUrl ?? '',
  categoryId: item.category ? String(item.category.id) : '',
  rating: ratedItem ? String(ratedItem.rating) : '',
  notes: ratedItem?.notes ?? '',
  attributeValues: Object.fromEntries(item.attributes.map((attributeValue) => [attributeValue.attribute.id, attributeValue.value])),
})

/** Builds the items API body, keeping only the filled-in values of the chosen category's attributes. */
export const toItemInput = (form: InterestForm, category: Category): ItemInput => ({
  name: form.name,
  description: form.description,
  imageUrl: form.imageUrl || null,
  categoryId: category.id,
  attributeValues: category.attributes
    .filter((attribute) => form.attributeValues[attribute.id])
    .map((attribute) => ({ attributeId: attribute.id, value: form.attributeValues[attribute.id] })),
})

/** Builds the ratings API body. */
export const toRatingInput = (form: InterestForm): RatingInput => ({
  rating: Number(form.rating),
  notes: form.notes,
})
