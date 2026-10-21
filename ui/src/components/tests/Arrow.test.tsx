import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import Arrow from '@/components/filters/Arrow'

/** Height of the header above the panel in these tests, in pixels. */
const HEADER_HEIGHT = 52

describe('Arrow', () => {
  test('opens the closed panel when clicked', () => {
    // GIVEN the tab of a closed panel under a 52px header
    const setIsOpen = jest.fn()
    render(<Arrow isOpen={false} setIsOpen={setIsOpen} top={HEADER_HEIGHT} isHeaderPinned />)
    const tab = screen.getByRole('button', { name: 'Open filters' })

    // WHEN it is clicked
    fireEvent.click(tab)

    // THEN the panel is asked to open, and the tab sits on the window's edge under the header
    expect(setIsOpen).toHaveBeenCalledWith(true)
    expect(tab).toHaveTextContent('›')
    expect(tab.style.left).toBe('0px')
    expect(tab.style.position).toBe('fixed')
    expect(tab.style.top).toBe('calc(52px + 1.25rem)')
  })

  test('scrolls away with a header that is not pinned, just under it', () => {
    // GIVEN a 52px header that scrolls with the page, as on phones and tablets
    // WHEN the tab renders
    render(<Arrow isOpen={false} setIsOpen={jest.fn()} top={HEADER_HEIGHT} isHeaderPinned={false} />)

    // THEN it sits on the page right under the header instead of staying on screen
    const tab = screen.getByRole('button', { name: 'Open filters' })
    expect(tab.style.position).toBe('absolute')
    expect(tab.style.top).toBe('calc(52px + 0.5rem)')
  })

  test('closes the open panel with the Enter key and ignores other keys', () => {
    // GIVEN the tab of an open panel
    const setIsOpen = jest.fn()
    render(<Arrow isOpen setIsOpen={setIsOpen} top={HEADER_HEIGHT} isHeaderPinned />)
    const tab = screen.getByRole('button', { name: 'Close filters' })

    // WHEN Space and then Enter are pressed on it
    fireEvent.keyDown(tab, { key: ' ' })
    fireEvent.keyDown(tab, { key: 'Enter' })

    // THEN only Enter asks the panel to close, and the tab rides along the panel's edge
    expect(setIsOpen.mock.calls).toEqual([[false]])
    expect(tab).toHaveTextContent('‹')
    expect(tab.style.left).toBe('300px')
  })
})
