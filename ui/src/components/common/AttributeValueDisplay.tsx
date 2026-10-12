import React from 'react'
import { AttributeValueType, type Attribute } from '@/components/types'

/** Props for one type-aware attribute value. */
interface AttributeValueDisplayProps {
  attribute: Attribute;
  value: string;
}

/** Formats a date-only attribute without shifting its calendar day across time zones. */
const formatDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

/** Presents an attribute value with a visual treatment suited to its type. */
const AttributeValueDisplay: React.FC<AttributeValueDisplayProps> = ({ attribute, value }) => {
  switch (attribute.valueType) {
    case AttributeValueType.NUMBER: {
      const number = Number(value)
      const formatted = value.trim() && Number.isFinite(number) ? new Intl.NumberFormat().format(number) : value
      return <p className="title is-5 mb-0">{formatted}</p>
    }
    case AttributeValueType.BOOLEAN:
      return <span className={`tag is-medium ${value === 'true' ? 'is-success' : 'is-light'}`}>{value === 'true' ? 'Yes' : 'No'}</span>
    case AttributeValueType.DATE:
      return <time className="has-text-weight-semibold" dateTime={value}>{formatDate(value)}</time>
    case AttributeValueType.STRING:
      return <p className="mb-0">{value}</p>
  }
}

export default AttributeValueDisplay
