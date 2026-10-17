import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import AttributeField from '@/components/interests/AttributeField'
import { formattedAttributes } from '@/components/tests/common/Categories'

describe('AttributeField', () => {
  test.each([
    ['a cent-step number with its currency code', formattedAttributes.price, 'number', '0.01', 'EUR'],
    ['a number with a percent sign', formattedAttributes.discount, 'number', 'any', '%'],
    ['a whole number of minutes', formattedAttributes.runtime, 'number', '1', 'min'],
  ])('asks for %s', (_case, attribute, type, step, unit) => {
    // GIVEN a formatted attribute
    // WHEN its field is shown
    render(<AttributeField attribute={attribute} value="" onChange={jest.fn()} />)

    // THEN the input takes numbers with the right step and the unit sits after it
    const input = screen.getByLabelText(attribute.name)
    expect(input).toHaveAttribute('type', type)
    expect(input).toHaveAttribute('step', step)
    expect(screen.getByText(unit)).toHaveClass('button', 'is-static')
  })

  test.each([
    ['a web address', formattedAttributes.website, 'url'],
    ['an email address', formattedAttributes.contact, 'email'],
  ])('asks for %s with the matching input type', (_case, attribute, type) => {
    // GIVEN a website or contact attribute
    // WHEN its field is shown
    render(<AttributeField attribute={attribute} value="" onChange={jest.fn()} />)

    // THEN the browser checks the value as that type
    expect(screen.getByLabelText(attribute.name)).toHaveAttribute('type', type)
  })

  test('hands typed values to the change handler', () => {
    // GIVEN the price field
    const onChange = jest.fn()
    render(<AttributeField attribute={formattedAttributes.price} value="" onChange={onChange} />)

    // WHEN an amount is typed
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '12.5' } })

    // THEN the handler receives it as typed
    expect(onChange).toHaveBeenCalledWith('12.5')
  })
})
