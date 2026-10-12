/** Formats date values consistently; date-only values keep their calendar day across time zones. */
export const formatDate = (value: string): string => {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(isDateOnly ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return value
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
  if (isDateOnly) options.timeZone = 'UTC'
  return new Intl.DateTimeFormat(undefined, options).format(date)
}
