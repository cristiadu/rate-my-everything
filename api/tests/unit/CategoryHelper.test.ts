import { describe, it, expect } from 'vitest'
import { isValidAttributeIds } from '@/helpers/CategoryHelper'

describe('isValidAttributeIds', () => {
  it.each([undefined, [], [1, 2]])('accepts %j', (attributeIds) => {
    // GIVEN attribute ids that are absent or integers
    // WHEN they are checked
    // THEN they are accepted
    expect(isValidAttributeIds(attributeIds)).toBe(true)
  })

})
