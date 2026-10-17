import React from 'react'
import { render, screen } from '@testing-library/react'
import { ImmediateResizeObserver } from '@/components/tests/common/ResizeObserver'
import { mockDesktopWidth } from '@/components/tests/common/MatchMedia'
import App from '@/components/App'

jest.mock('resize-observer-polyfill', () => ({ __esModule: true, default: ImmediateResizeObserver }))

/** Height the fixed top menu is laid out at in the resize test, in pixels. */
const NAVBAR_HEIGHT = 52

describe('App', () => {
  beforeEach(() => {
    mockDesktopWidth(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the app with its filter panel', () => {
    // GIVEN the app
    // WHEN it renders
    render(<App />)

    // THEN the filter panel is shown
    expect(screen.getByText(/Filters/i)).toBeInTheDocument()
  })

  test('places the filter tab under the top menu once the menu is laid out', () => {
    // GIVEN a browser that lays the top menu out 52px high
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(NAVBAR_HEIGHT)

    // WHEN the app renders
    render(<App />)

    // THEN the filter tab sits under the menu instead of at the top of the window
    expect(screen.getByRole('button', { name: 'Open filters' }).style.top).toBe('calc(52px + 1.25rem)')
  })

  test('pins the header on desktop widths', () => {
    // GIVEN a desktop-wide window
    // WHEN the app renders
    const { container } = render(<App />)

    // THEN the header stays at the top of the window
    expect(container.querySelector('.navbar')).toHaveClass('is-fixed-top')
  })

  test('lets the header scroll away and opens the filters from the window top on narrower screens', () => {
    // GIVEN a phone or tablet window and a top menu laid out 52px high
    mockDesktopWidth(false)
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(NAVBAR_HEIGHT)

    // WHEN the app renders
    const { container } = render(<App />)

    // THEN the header scrolls with the page and the filter tab sits at the top of the window
    expect(container.querySelector('.navbar')).not.toHaveClass('is-fixed-top')
    expect(screen.getByRole('button', { name: 'Open filters' }).style.top).toBe('calc(0px + 1.25rem)')
  })
})
