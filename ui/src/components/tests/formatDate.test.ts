import { formatDate } from '@/components/common/formatDate'

describe('formatDate', () => {
  test('preserves calendar dates for date-only values', () => {
    // GIVEN the date-only value 2026-10-01, and how the viewer's locale writes October 1, 2026
    const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-10-01T00:00:00Z'))

    // WHEN it is formatted
    // THEN the same calendar day is shown, whatever the time zone
    expect(formatDate('2026-10-01')).toBe(expected)
  })

  test('leaves invalid date values unchanged', () => {
    // GIVEN a value that is not a date
    // WHEN it is formatted
    // THEN it comes back unchanged
    expect(formatDate('not a date')).toBe('not a date')
  })
})
