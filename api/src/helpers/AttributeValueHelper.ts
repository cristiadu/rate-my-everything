import type Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import { InvalidAttributeValue } from '@/errors/InvalidAttributeValue'

/** How to recognize a valid value of one value type, and how to describe one in an error. */
interface ValueTypeRule {
  isValid: (value: string) => boolean
  expected: string
}

/** Days written as `YYYY-MM-DD`, the format date inputs send. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Whole, non-negative numbers of minutes. */
const WHOLE_MINUTES_PATTERN = /^\d+$/

/** Addresses with something before the @, a domain and a top-level domain, and no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Protocols a URL attribute accepts, so values open as web pages. */
const WEB_PROTOCOLS = ['http:', 'https:']

/** Whether the value is a finite number, such as `12.5` or `-3`. */
const isNumber = (value: string): boolean => value.trim() !== '' && Number.isFinite(Number(value))

/** Whether the value is a real calendar day written as `YYYY-MM-DD`. */
const isDate = (value: string): boolean => {
  const date = new Date(value)
  return DATE_PATTERN.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

/** Whether the value is an http or https address. */
const isWebUrl = (value: string): boolean => URL.canParse(value) && WEB_PROTOCOLS.includes(new URL(value).protocol)

/** The rule each value type's values follow. */
const VALUE_TYPE_RULES: Record<AttributeValueType, ValueTypeRule> = {
  [AttributeValueType.STRING]: { isValid: () => true, expected: 'any text' },
  [AttributeValueType.NUMBER]: { isValid: isNumber, expected: 'a number such as 412' },
  [AttributeValueType.BOOLEAN]: { isValid: (value) => value === 'true' || value === 'false', expected: 'true or false' },
  [AttributeValueType.DATE]: { isValid: isDate, expected: 'a date such as 2026-10-17' },
  [AttributeValueType.CURRENCY]: { isValid: isNumber, expected: 'an amount such as 12.50' },
  [AttributeValueType.PERCENTAGE]: { isValid: isNumber, expected: 'a number of percent such as 85' },
  [AttributeValueType.URL]: { isValid: isWebUrl, expected: 'a web address such as https://example.com' },
  [AttributeValueType.EMAIL]: { isValid: (value) => EMAIL_PATTERN.test(value), expected: 'an email address such as name@example.com' },
  [AttributeValueType.DURATION]: {
    isValid: (value) => WHOLE_MINUTES_PATTERN.test(value), expected: 'a whole number of minutes such as 135',
  },
}

/** Rejects a value that does not fit its attribute's value type, such as `abc` for a currency attribute. */
export const checkAttributeValue = (attribute: Pick<Attribute, 'name' | 'valueType'>, value: string): void => {
  const rule = VALUE_TYPE_RULES[attribute.valueType]
  if (!rule.isValid(value)) {
    throw new InvalidAttributeValue(`Invalid value "${value}" for ${attribute.name}: expected ${rule.expected}`)
  }
}

/**
 * Returns the currency code an attribute keeps: the upper-cased ISO 4217 code for a currency attribute, rejecting a
 * missing or unknown one, and none for every other value type.
 */
export const currencyCodeFor = (valueType: AttributeValueType, currencyCode?: string | null): string | null => {
  if (valueType !== AttributeValueType.CURRENCY) {
    return null
  }
  const code = currencyCode?.trim().toUpperCase() ?? ''
  if (!Intl.supportedValuesOf('currency').includes(code)) {
    throw new InvalidAttributeValue(
      `Invalid currency code "${currencyCode ?? ''}": a currency attribute needs an ISO 4217 code such as USD`,
    )
  }
  return code
}
