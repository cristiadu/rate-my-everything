import AttributeValueType from '@/models/AttributeValueType'
import type { AttributeInput } from '@/models/Attribute'
import type { CategoryInput } from '@/models/Category'
import type { UserInput } from '@/models/User'

/** The first admin account, read from the BOOTSTRAP_ADMIN_* environment variables. */
export interface BootstrapAdmin extends Pick<Required<UserInput>, 'username' | 'email' | 'password'> {}

/** A starter category with the attributes its items are described by. */
export interface BootstrapCategory extends Required<Pick<CategoryInput, 'name' | 'description' | 'color'>> {
  attributes: AttributeInput[]
}

/** Year something came out, shared by the categories that have one. */
const RELEASE_YEAR: AttributeInput = { name: 'Release year', valueType: AttributeValueType.NUMBER }

/** Whether the user got to the end, shared by books and games. */
const FINISHED: AttributeInput = { name: 'Finished', valueType: AttributeValueType.BOOLEAN }

/** Categories and attributes a fresh database starts with; existing ones with the same name are left as they are. */
export const BOOTSTRAP_CATEGORIES: BootstrapCategory[] = [
  {
    name: 'Movies',
    description: 'Feature films, documentaries and animation.',
    color: '#E4572E',
    attributes: [
      { name: 'Director', valueType: AttributeValueType.STRING },
      RELEASE_YEAR,
      { name: 'Runtime', valueType: AttributeValueType.DURATION },
    ],
  },
  {
    name: 'Music',
    description: 'Albums, singles and artists.',
    color: '#8E44AD',
    attributes: [
      { name: 'Artist', valueType: AttributeValueType.STRING },
      { name: 'Genre', valueType: AttributeValueType.STRING },
      RELEASE_YEAR,
    ],
  },
  {
    name: 'Books',
    description: 'Novels, comics and non-fiction.',
    color: '#3E8ED0',
    attributes: [
      { name: 'Author', valueType: AttributeValueType.STRING },
      { name: 'Pages', valueType: AttributeValueType.NUMBER },
      RELEASE_YEAR,
      FINISHED,
    ],
  },
  {
    name: 'Games',
    description: 'Video games and board games.',
    color: '#2E8B57',
    attributes: [
      { name: 'Platform', valueType: AttributeValueType.STRING },
      RELEASE_YEAR,
      FINISHED,
    ],
  },
  {
    name: 'Restaurants',
    description: 'Places to eat and drink.',
    color: '#F4A259',
    attributes: [
      { name: 'Cuisine', valueType: AttributeValueType.STRING },
      { name: 'City', valueType: AttributeValueType.STRING },
      { name: 'Last visited', valueType: AttributeValueType.DATE },
      { name: 'Price per person', valueType: AttributeValueType.CURRENCY, currencyCode: 'USD' },
      { name: 'Website', valueType: AttributeValueType.URL },
    ],
  },
]
