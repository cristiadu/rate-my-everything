import { describe, it, expect } from 'vitest'
import { parseRatingFilters } from '@/helpers/RatingFilterHelper'
import RankingScope from '@/models/RankingScope'
import { InvalidQueryParameter } from '@/errors/InvalidQueryParameter'

describe('parseRatingFilters', () => {
  it('reads every filter, keeping repeated categories and attributes', () => {
    // GIVEN a query with every filter, two categories and two attributes, one value holding the separator
    const query = {
      name: ' dune ', categoryId: ['1', '2'], attribute: ['3:Frank Herbert', '4:12:30'], minGrade: '6.5', maxGrade: '9', scope: 'mine',
    }

    // WHEN it is read
    const filters = parseRatingFilters(query)

    // THEN each filter comes back typed and trimmed
    expect(filters).toEqual({
      name: 'dune',
      categoryIds: [1, 2],
      attributes: [{ attributeId: 3, value: 'Frank Herbert' }, { attributeId: 4, value: '12:30' }],
      minGrade: 6.5,
      maxGrade: 9,
      scope: RankingScope.MINE,
    })
  })

  it('keeps everything for everyone when no filter is sent', () => {
    // GIVEN an empty query
    // WHEN it is read
    const filters = parseRatingFilters({})

    // THEN nothing is filtered and the scope is everyone's ratings
    expect(filters).toEqual({
      name: undefined, categoryIds: [], attributes: [], minGrade: undefined, maxGrade: undefined, scope: RankingScope.ALL,
    })
  })

  it.each([
    [{ minGrade: '-1' }, 'Invalid value for minGrade: it must be a number from 0 to 10'],
    [{ maxGrade: '' }, 'Invalid value for maxGrade: it must be a number from 0 to 10'],
    [{ categoryId: '1.5' }, 'Invalid value for categoryId: it must be an integer'],
    [{ attribute: 'x:Herbert' }, 'Invalid value for attribute: it must be an integer'],
    [{ attribute: '3: ' }, 'Invalid value for attribute: it must be an attribute id and a value, as in 3:Frank Herbert'],
    [{ scope: 'theirs' }, 'Invalid value for scope: it must be one of: mine, all'],
  ])('rejects %o', (query, message) => {
    // GIVEN a query with a value that cannot be used
    // WHEN it is read
    // THEN it fails naming the parameter
    expect(() => parseRatingFilters(query)).toThrow(InvalidQueryParameter)
    expect(() => parseRatingFilters(query)).toThrow(message)
  })
})
