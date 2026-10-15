import { NO_INTEREST_FILTERS, RankingScope, type InterestFilters } from '@/components/types'
import {
  filterAttributes, hasFilters, toAppliedFilters, toRatingQuery,
} from '@/components/filters/filterQuery'
import { booksCategory, moviesCategory } from '@/components/tests/common/Interests'
import { testCategories } from '@/components/tests/common/Categories'

/** Filters typed in the panel: Author, Pages and Finished filled in for Books, plus a value for an attribute no longer shown. */
const typedFilters: InterestFilters = {
  name: ' dune ',
  categoryIds: [booksCategory.id],
  attributeValues: { 1: ' Herbert ', 2: '', 3: 'false', 99: 'stale' },
  minGrade: '6',
  maxGrade: '',
}

describe('filterAttributes', () => {
  test('lists the attributes of the chosen categories once each', () => {
    // GIVEN Books with Author, Pages and Finished, another category sharing Author, and Movies without attributes
    const categories = [booksCategory, { ...testCategories[0], id: 11, name: 'Comics' }, moviesCategory]

    // WHEN Books and Comics are chosen
    const attributes = filterAttributes(categories, [booksCategory.id, 11])

    // THEN Author shows once, then Pages and Finished
    expect(attributes.map((attribute) => attribute.name)).toEqual(['Author', 'Pages', 'Finished'])
  })
})

describe('toAppliedFilters', () => {
  test('keeps only the filled-in values of shown attributes and ticked yes/no attributes', () => {
    // GIVEN the typed filters
    // WHEN they are applied with the Books attributes shown
    const applied = toAppliedFilters(typedFilters, booksCategory.attributes)

    // THEN the name is trimmed, and only Author is kept
    expect(applied).toEqual({
      name: 'dune', categoryIds: [10], attributeValues: { 1: 'Herbert' }, minGrade: '6', maxGrade: '',
    })
  })
})

describe('hasFilters', () => {
  test('tells whether any filter is set', () => {
    // GIVEN no filters, and only a highest grade
    // WHEN checking them
    // THEN only the second has a filter
    expect(hasFilters(NO_INTEREST_FILTERS)).toBe(false)
    expect(hasFilters({ ...NO_INTEREST_FILTERS, maxGrade: '8' })).toBe(true)
  })
})

describe('toRatingQuery', () => {
  test('sends the scope and each filter that is set as the API query parameters', () => {
    // GIVEN applied filters with a name, two categories, two attributes and a lowest grade
    const filters: InterestFilters = {
      name: 'dune', categoryIds: [10, 20], attributeValues: { 1: 'Frank Herbert', 2: '412' }, minGrade: '6', maxGrade: '',
    }

    // WHEN building the query for my interests
    const query = toRatingQuery(filters, RankingScope.MINE)

    // THEN every filter is a parameter, repeated for categories and attributes, and the empty highest grade is left out
    expect(query).toBe('scope=mine&name=dune&categoryId=10&categoryId=20&attribute=1%3AFrank+Herbert&attribute=2%3A412&minGrade=6')
  })

  test('sends only the scope without filters', () => {
    // GIVEN no filters
    // WHEN building the query for all rankings
    // THEN only the scope is sent
    expect(toRatingQuery(NO_INTEREST_FILTERS, RankingScope.ALL)).toBe('scope=all')
  })
})
