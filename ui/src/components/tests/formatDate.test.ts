import { formatDate } from '@/components/common/formatDate'

describe('formatDate', () => {
  test('preserves calendar dates for date-only values', () => {
    const date = new Date('2026-10-01T00:00:00Z')
    const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)

    expect(formatDate('2026-10-01')).toBe(expected)
  })

  test('leaves invalid date values unchanged', () => {
    expect(formatDate('not a date')).toBe('not a date')
  })
})
