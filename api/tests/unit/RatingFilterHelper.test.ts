import { describe, it, expect } from 'vitest'
import { parseRatingFilters } from '@/helpers/RatingFilterHelper'
import RankingScope from '@/models/RankingScope'
import { RequestRejected } from '@/errors/RequestRejected'

describe('parseRatingFilters', () => {
  it('reads every filter, keeping repeated categories and attributes', () => {
    // GIVEN a query with every filter, two categories and two attributes, one value holding the separator
    const query = {
      name: ' dune ', categoryId: [1, 2], attribute: ['3:Frank Herbert', '4:12:30'], minGrade: 6.5, maxGrade: 9, scope: RankingScope.MINE,
    }

    // WHEN it is read
    const filters = parseRatingFilters(query)

    // THEN each filter comes back trimmed, with the attributes split into id and value
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

  it.each(['x:Herbert', '3: ', 'Herbert', ':Herbert'])('rejects the attribute filter %s', (attribute) => {
    // GIVEN an attribute filter without a numeric id and a value
    // WHEN it is read
    // THEN the request is rejected naming the filter
    expect(() => parseRatingFilters({ attribute: [attribute] })).toThrow(RequestRejected)
    expect(() => parseRatingFilters({ attribute: [attribute] })).toThrow(`Invalid attribute filter "${attribute}"`)
  })
})
