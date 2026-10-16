import {
  AttributeValueType, type AttributeResponse, type CategoryResponse, type ItemResponse, type RatedItemResponse,
} from '@/api/generated/api'
import { testAttributes, testCategories } from '@/components/tests/common/Categories'

const [authorAttribute, pagesAttribute] = testAttributes

/** Boolean attribute recording whether a book was finished. */
const finishedAttribute: AttributeResponse = { id: 3, name: 'Finished', valueType: AttributeValueType.BOOLEAN }

/** The shared Books category, linked to Author, Pages and Finished. */
export const booksCategory: CategoryResponse = { ...testCategories[0], attributes: [authorAttribute, pagesAttribute, finishedAttribute] }

/** Date attribute recording when a film came out. */
const releasedAttribute: AttributeResponse = { id: 4, name: 'Released', valueType: AttributeValueType.DATE }

/** Category whose only attribute is a date, so Books and Films together hold every attribute value type. */
export const filmsCategory: CategoryResponse = { id: 30, name: 'Films', description: null, attributes: [releasedAttribute] }

/** Category without attributes. */
export const moviesCategory: CategoryResponse = { id: 20, name: 'Movies', description: null, attributes: [] }

/** A book the signed-in user rated, with its Pages value filled in. */
export const duneItem: ItemResponse = {
  id: 100,
  name: 'Dune',
  description: 'Desert planet epic',
  imageUrl: 'https://example.com/dune.png',
  category: { id: booksCategory.id, name: booksCategory.name, description: booksCategory.description },
  attributes: [{ id: 500, attribute: pagesAttribute, value: '412' }],
}

/** Id of the signed-in test user in rating fixtures. */
const MY_USER_ID = 1

/** Id of another user in rating fixtures. */
const OTHER_USER_ID = 2

/** The signed-in user's first rating of Dune. */
export const duneRating: RatedItemResponse = {
  id: 900, rating: 9.5, notes: 'Reread every year', userId: MY_USER_ID, ratedAt: '2026-09-01T10:00:00.000Z', item: duneItem,
}

/** The signed-in user's later, second rating of Dune. */
export const duneRerating: RatedItemResponse = {
  ...duneRating, id: 903, rating: 8.5, notes: 'Slower the second time', ratedAt: '2026-10-01T10:00:00.000Z',
}

/** The signed-in user's earliest rating of Dune, before the other two. */
export const duneFirstRating: RatedItemResponse = {
  ...duneRating, id: 904, rating: 7, notes: 'Hard to get into', ratedAt: '2026-08-01T10:00:00.000Z',
}

/** Another user's rating of Dune. */
export const otherUserDuneRating: RatedItemResponse = {
  ...duneRating, id: 902, rating: 6, notes: null, userId: OTHER_USER_ID, ratedAt: '2026-09-15T10:00:00.000Z',
}

/** A movie rated by another user, without an image. */
export const alienRating: RatedItemResponse = {
  id: 901,
  rating: 7,
  notes: null,
  userId: OTHER_USER_ID,
  ratedAt: '2026-09-20T10:00:00.000Z',
  item: {
    id: 101, name: 'Alien', description: 'Space horror', imageUrl: null, category: { id: moviesCategory.id, name: moviesCategory.name },
  },
}
