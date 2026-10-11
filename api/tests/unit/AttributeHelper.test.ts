import { describe, it, expect } from 'vitest'
import { isAttributeValueType } from '@/helpers/AttributeHelper'
import AttributeValueType from '@/models/AttributeValueType'

describe('isAttributeValueType', () => {
  it.each(Object.values(AttributeValueType))('accepts %s', (valueType) => {
    // GIVEN an AttributeValueType value
    // WHEN it is checked
    // THEN it is accepted
    expect(isAttributeValueType(valueType)).toBe(true)
  })

  it('rejects a value outside the enum', () => {
    // GIVEN a value type the enum does not have
    // WHEN it is checked
    // THEN it is rejected
    expect(isAttributeValueType('colour')).toBe(false)
  })
})
