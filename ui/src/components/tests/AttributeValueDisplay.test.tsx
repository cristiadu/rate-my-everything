import React from 'react'
import { render, screen } from '@testing-library/react'
import AttributeValueDisplay from '@/components/common/AttributeValueDisplay'
import { formattedAttributes, testAttributes } from '@/components/tests/common/Categories'

describe('AttributeValueDisplay', () => {
  test.each([
    ['an amount in its attribute currency', formattedAttributes.price, '12.5', '€12.50'],
    ['a percentage', formattedAttributes.discount, '12.5', '12.5%'],
    ['a duration in hours and minutes', formattedAttributes.runtime, '135', '2 hr 15 min'],
    ['a duration under an hour in minutes', formattedAttributes.runtime, '45', '45 min'],
    ['a duration of whole hours in hours', formattedAttributes.runtime, '120', '2 hr'],
    ['a large number with separators', testAttributes[1], '1234', '1,234'],
    ['a value that is not a number as stored', formattedAttributes.price, 'about 12', 'about 12'],
  ])('shows %s', (_case, attribute, value, expected) => {
    // GIVEN a stored value of a formatted attribute
    // WHEN it is shown
    render(<AttributeValueDisplay attribute={attribute} value={value} />)

    // THEN it is formatted for the viewer
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  test('links a website by its host and path, opening a new tab', () => {
    // GIVEN a website value
    // WHEN it is shown
    render(<AttributeValueDisplay attribute={formattedAttributes.website} value="https://example.com/menu" />)

    // THEN it links to the page in a new tab, without the protocol in its text
    const link = screen.getByRole('link', { name: 'example.com/menu' })
    expect(link).toHaveAttribute('href', 'https://example.com/menu')
    expect(link).toHaveAttribute('target', '_blank')
  })

  test('shows a website that is not a web address as plain text', () => {
    // GIVEN a website value with a script protocol
    // WHEN it is shown
    render(<AttributeValueDisplay attribute={formattedAttributes.website} value="javascript:alert(1)" />)

    // THEN it is not a link
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('links an email address to write to it', () => {
    // GIVEN an email value
    // WHEN it is shown
    render(<AttributeValueDisplay attribute={formattedAttributes.contact} value="bookings@example.com" />)

    // THEN it opens a new email to that address
    expect(screen.getByRole('link', { name: 'bookings@example.com' })).toHaveAttribute('href', 'mailto:bookings@example.com')
  })
})
