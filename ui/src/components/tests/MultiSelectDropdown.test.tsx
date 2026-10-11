import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown'
import type { SelectOption } from '@/components/types'

/** Options shown in the dropdown under test. */
const options: SelectOption[] = [
  { value: 1, label: 'Author' },
  { value: 2, label: 'Pages' },
]

describe('MultiSelectDropdown', () => {
  test('shows the selected options as tags and the placeholder when none are selected', () => {
    // GIVEN one dropdown with Author selected and one with nothing selected
    // WHEN they render
    render(
      <>
        <MultiSelectDropdown id="a" label="With selection" options={options} selected={[1]} onChange={jest.fn()} />
        <MultiSelectDropdown id="b" label="Empty" placeholder="Pick some" options={options} selected={[]} onChange={jest.fn()} />
      </>,
    )

    // THEN the chosen option is a tag and the empty one shows its placeholder
    expect(screen.getByRole('button', { name: 'With selection' })).toHaveTextContent('Author')
    expect(screen.getByRole('button', { name: 'Empty' })).toHaveTextContent('Pick some')
  })

  test('opens on click and adds or removes a ticked option', () => {
    // GIVEN a closed dropdown with Author selected
    const onChange = jest.fn()
    render(<MultiSelectDropdown id="a" label="Attributes" options={options} selected={[1]} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: 'Attributes' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // WHEN it is opened and Pages then Author are clicked
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pages' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Author' }))

    // THEN it is open, Pages is added and Author is removed
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(onChange).toHaveBeenNthCalledWith(1, [1, 2])
    expect(onChange).toHaveBeenNthCalledWith(2, [])
  })

  test('closes when clicking outside', () => {
    // GIVEN an open dropdown
    render(<MultiSelectDropdown id="a" label="Attributes" options={options} selected={[]} onChange={jest.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Attributes' })
    fireEvent.click(trigger)

    // WHEN the user clicks elsewhere on the page
    fireEvent.mouseDown(document.body)

    // THEN it closes
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
