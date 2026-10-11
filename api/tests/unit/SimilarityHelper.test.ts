import { describe, it, expect } from 'vitest'
import {
  MAX_SIMILAR_RESULTS, findSimilarByName, nameSimilarity, normalizeName,
} from '@/helpers/SimilarityHelper'

describe('normalizeName', () => {
  it.each([
    ['The Lord of the Rings', 'lord of the rings'],
    ['  Pokémon:   Red! ', 'pokemon red'],
    ['A Clockwork Orange', 'clockwork orange'],
    ['Anathem', 'anathem'],
  ])('normalizes %j to %j', (name, expected) => {
    // GIVEN a name as a user typed it
    // WHEN it is normalized
    // THEN case, accents, punctuation, extra spaces and a leading article are gone
    expect(normalizeName(name)).toBe(expected)
  })
})

describe('nameSimilarity', () => {
  it.each([
    ['Dune', 'dune'],
    ['The Lord of the Rings', 'Lord of the Rings'],
    ['Board Games', 'boardgames'],
  ])('scores %j and %j as the same name', (firstName, secondName) => {
    // GIVEN two names that differ only in case, spacing or a leading article
    // WHEN they are compared
    // THEN they score 1
    expect(nameSimilarity(firstName, secondName)).toBe(1)
  })

  it('scores a one-letter typo above the duplicate threshold', () => {
    // GIVEN a name and a misspelling of it
    // WHEN they are compared
    // THEN they share 9 of their 11 character pairs each
    expect(nameSimilarity('Interstellar', 'Intersteller')).toBeCloseTo(18 / 22)
  })

  it.each([
    ['Hyperion', 'Dune'],
    ['', ''],
    ['A', 'B'],
  ])('scores %j and %j as unrelated', (firstName, secondName) => {
    // GIVEN two names that share no character pairs
    // WHEN they are compared
    // THEN they score 0
    expect(nameSimilarity(firstName, secondName)).toBe(0)
  })
})

describe('findSimilarByName', () => {
  it('keeps only likely duplicates, most similar first', () => {
    // GIVEN records with an exact match, a close match and an unrelated name
    const records = [{ id: 1, name: 'Aliens' }, { id: 2, name: 'Hyperion' }, { id: 3, name: 'Alien' }]

    // WHEN records similar to "alien" are found
    const similarRecords = findSimilarByName(records, 'alien')

    // THEN the exact match comes before the close one and the unrelated name is left out
    expect(similarRecords.map((record) => record.id)).toEqual([3, 1])
  })

  it('returns at most the maximum number of records', () => {
    // GIVEN more identical names than the maximum
    const records = Array.from({ length: MAX_SIMILAR_RESULTS + 2 }, (_, index) => ({ id: index, name: 'Dune' }))

    // WHEN records similar to "Dune" are found
    const similarRecords = findSimilarByName(records, 'Dune')

    // THEN only 5 are returned
    expect(similarRecords).toHaveLength(5)
  })
})
