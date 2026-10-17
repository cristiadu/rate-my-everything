import { describe, it, expect } from 'vitest'
import { checkAttributeValue, currencyCodeFor } from '@/helpers/AttributeValueHelper'
import AttributeValueType from '@/models/AttributeValueType'
import { InvalidAttributeValue } from '@/errors/InvalidAttributeValue'

describe('checkAttributeValue', () => {
  it.each([
    [AttributeValueType.STRING, 'Frank Herbert'],
    [AttributeValueType.NUMBER, '-3.5'],
    [AttributeValueType.BOOLEAN, 'false'],
    [AttributeValueType.DATE, '2024-02-29'],
    [AttributeValueType.CURRENCY, '12.50'],
    [AttributeValueType.PERCENTAGE, '85'],
    [AttributeValueType.URL, 'https://www.imdb.com/title/tt15239678/'],
    [AttributeValueType.EMAIL, 'bookings@example.com'],
    [AttributeValueType.DURATION, '166'],
  ])('accepts the %s value %s', (valueType, value) => {
    // GIVEN an attribute of the value type
    const attribute = { name: 'Detail', valueType }

    // WHEN a value that fits it is checked
    // THEN nothing is thrown
    expect(() => checkAttributeValue(attribute, value)).not.toThrow()
  })

  it.each([
    [AttributeValueType.NUMBER, '', 'Invalid value "" for Detail: expected a number such as 412'],
    [AttributeValueType.BOOLEAN, 'yes', 'Invalid value "yes" for Detail: expected true or false'],
    [AttributeValueType.DATE, '2023-02-29', 'Invalid value "2023-02-29" for Detail: expected a date such as 2026-10-17'],
    [AttributeValueType.DATE, '17/10/2026', 'Invalid value "17/10/2026" for Detail: expected a date such as 2026-10-17'],
    [AttributeValueType.CURRENCY, '$12', 'Invalid value "$12" for Detail: expected an amount such as 12.50'],
    [AttributeValueType.PERCENTAGE, '85%', 'Invalid value "85%" for Detail: expected a number of percent such as 85'],
    [AttributeValueType.URL, 'ftp://x.io', 'Invalid value "ftp://x.io" for Detail: expected a web address such as https://example.com'],
    [AttributeValueType.URL, 'x.io', 'Invalid value "x.io" for Detail: expected a web address such as https://example.com'],
    [AttributeValueType.EMAIL, 'me@home', 'Invalid value "me@home" for Detail: expected an email address such as name@example.com'],
    [AttributeValueType.DURATION, '2.5', 'Invalid value "2.5" for Detail: expected a whole number of minutes such as 135'],
    [AttributeValueType.DURATION, '-10', 'Invalid value "-10" for Detail: expected a whole number of minutes such as 135'],
  ])('rejects the %s value %s', (valueType, value, message) => {
    // GIVEN an attribute of the value type
    const attribute = { name: 'Detail', valueType }

    // WHEN a value that does not fit it is checked
    // THEN it is rejected naming the attribute and the expected format
    expect(() => checkAttributeValue(attribute, value)).toThrow(new InvalidAttributeValue(message))
  })
})

describe('currencyCodeFor', () => {
  it('keeps the upper-cased code of a currency attribute', () => {
    // GIVEN a currency attribute given a lower-case code with spaces
    // WHEN its code is read
    const code = currencyCodeFor(AttributeValueType.CURRENCY, ' eur ')

    // THEN the ISO 4217 code is kept upper-cased
    expect(code).toBe('EUR')
  })

  it('drops the code of every other value type', () => {
    // GIVEN a number attribute given a currency code
    // WHEN its code is read
    const code = currencyCodeFor(AttributeValueType.NUMBER, 'USD')

    // THEN no code is kept
    expect(code).toBeNull()
  })

  it.each([undefined, null, '', 'ABC'])('rejects the currency code %s for a currency attribute', (currencyCode) => {
    // GIVEN a currency attribute without a known ISO 4217 code
    // WHEN its code is read
    // THEN it is rejected asking for a code such as USD
    expect(() => currencyCodeFor(AttributeValueType.CURRENCY, currencyCode)).toThrow(new InvalidAttributeValue(
      `Invalid currency code "${currencyCode ?? ''}": a currency attribute needs an ISO 4217 code such as USD`,
    ))
  })
})
