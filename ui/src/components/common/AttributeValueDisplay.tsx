import React from 'react'
import { AttributeValueType, type AttributeResponse } from '@/api/generated/api'
import { formatDate } from '@/components/common/formatDate'

/** Props for one type-aware attribute value. */
interface AttributeValueDisplayProps {
  attribute: AttributeResponse;
  value: string;
}

/** Minutes in an hour, for splitting durations stored in minutes. */
const MINUTES_PER_HOUR = 60

/** Percentage values are stored as a number of percent, so 85 is shown as 85%. */
const PERCENT_DIVISOR = 100

/** Most decimals shown for a percentage. */
const MAX_PERCENT_FRACTION_DIGITS = 2

/** Protocols linked as web pages; anything else is shown as plain text. */
const WEB_PROTOCOLS = ['http:', 'https:']

/** Reads a stored value as a number, or null when it is not one. */
const toNumber = (value: string): number | null => {
  const number = Number(value)
  return value.trim() && Number.isFinite(number) ? number : null
}

/** Formats a duration stored in whole minutes as hours and minutes, such as 2 hr 15 min. */
const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  const hourText = new Intl.NumberFormat(undefined, { style: 'unit', unit: 'hour', unitDisplay: 'short' }).format(hours)
  const minuteText = new Intl.NumberFormat(undefined, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(minutes)
  if (hours === 0) return minuteText
  return minutes === 0 ? hourText : `${hourText} ${minuteText}`
}

/** Presents an attribute value with a visual treatment suited to its type. */
const AttributeValueDisplay: React.FC<AttributeValueDisplayProps> = ({ attribute, value }) => {
  const number = toNumber(value)
  switch (attribute.valueType) {
    case AttributeValueType.NUMBER:
      return <p className="title is-5 mb-0">{number === null ? value : new Intl.NumberFormat().format(number)}</p>
    case AttributeValueType.CURRENCY: {
      const formatted = number === null || !attribute.currencyCode
        ? value
        : new Intl.NumberFormat(undefined, { style: 'currency', currency: attribute.currencyCode }).format(number)
      return <p className="title is-5 mb-0">{formatted}</p>
    }
    case AttributeValueType.PERCENTAGE: {
      const formatted = number === null
        ? value
        : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: MAX_PERCENT_FRACTION_DIGITS })
          .format(number / PERCENT_DIVISOR)
      return <p className="title is-5 mb-0">{formatted}</p>
    }
    case AttributeValueType.DURATION:
      return <p className="title is-5 mb-0">{number === null ? value : formatDuration(number)}</p>
    case AttributeValueType.BOOLEAN:
      return <span className={`tag is-medium ${value === 'true' ? 'is-success' : 'is-light'}`}>{value === 'true' ? 'Yes' : 'No'}</span>
    case AttributeValueType.DATE:
      return <time className="has-text-weight-semibold" dateTime={value}>{formatDate(value)}</time>
    case AttributeValueType.URL: {
      const url = URL.canParse(value) ? new URL(value) : null
      if (!url || !WEB_PROTOCOLS.includes(url.protocol)) return <p className="mb-0">{value}</p>
      return <a href={url.href} target="_blank" rel="noopener noreferrer">{`${url.host}${url.pathname === '/' ? '' : url.pathname}`}</a>
    }
    case AttributeValueType.EMAIL:
      return <a href={`mailto:${value}`}>{value}</a>
    case AttributeValueType.STRING:
      return <p className="mb-0">{value}</p>
  }
}

export default AttributeValueDisplay
