import {
  AttributeValueType, type Attribute, type Category, type Item, type RatedItem,
} from '@/components/types'
import { testAttributes, testCategories } from '@/components/tests/common/Categories'

const [authorAttribute, pagesAttribute] = testAttributes

/** Boolean attribute recording whether a book was finished. */
const finishedAttribute: Attribute = { id: 3, name: 'Finished', valueType: AttributeValueType.BOOLEAN }

/** The shared Books category, linked to Author, Pages and Finished. */
export const booksCategory: Category = { ...testCategories[0], attributes: [authorAttribute, pagesAttribute, finishedAttribute] }

/** Category without attributes. */
export const moviesCategory: Category = { id: 20, name: 'Movies', description: null, attributes: [] }

/** A book the signed-in user rated, with its Pages value filled in. */
export const duneItem: Item = {
  id: 100,
  name: 'Dune',
  description: 'Desert planet epic',
  imageUrl: 'https://example.com/dune.png',
  category: { id: booksCategory.id, name: booksCategory.name, description: booksCategory.description },
  attributes: [{ id: 500, attribute: pagesAttribute, value: '412' }],
}

/** The signed-in user's rating of Dune. */
export const duneRating: RatedItem = { id: 900, rating: 9.5, notes: 'Reread every year', item: duneItem }

/** A movie rated by another user, without an image. */
export const alienRating: RatedItem = {
  id: 901,
  rating: 7,
  notes: null,
  item: {
    id: 101, name: 'Alien', description: 'Space horror', imageUrl: null, category: { id: moviesCategory.id, name: moviesCategory.name },
  },
}
