import { describe, it, expect } from 'vitest'
import { isValidSimilarName, orderByIds } from '@/helpers/SimilarityHelper'

describe('isValidSimilarName', () => {
  it('accepts a name with text', () => {
    // GIVEN a name query value with text
    // WHEN it is checked
    // THEN it is accepted
    expect(isValidSimilarName('Dune')).toBe(true)
  })

  it.each([undefined, '', '   ', ['Dune', 'Alien']])('rejects %j', (name) => {
    // GIVEN a missing, blank or repeated name query value
    // WHEN it is checked
    // THEN it is rejected
    expect(isValidSimilarName(name)).toBe(false)
  })
})

describe('orderByIds', () => {
  it('puts records in the order of the ids and skips ids without a record', () => {
    // GIVEN records loaded in id order and a ranking that also names a deleted id
    const records = [{ id: 1, name: 'Aliens' }, { id: 3, name: 'Alien' }]

    // WHEN they are ordered by the ranking
    const orderedRecords = orderByIds(records, [3, 2, 1])

    // THEN Alien comes first, then Aliens
    expect(orderedRecords).toEqual([{ id: 3, name: 'Alien' }, { id: 1, name: 'Aliens' }])
  })
})
