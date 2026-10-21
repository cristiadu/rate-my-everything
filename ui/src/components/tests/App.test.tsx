import React from 'react'
import { render, screen } from '@testing-library/react'
import { ImmediateResizeObserver, disconnectResizeObserver } from '@/components/tests/common/ResizeObserver'
import { mockDesktopWidth } from '@/components/tests/common/MatchMedia'
import { loginAs } from '@/components/tests/common/Auth'
import App from '@/components/App'
import { UserRole } from '@/api/generated/api'

jest.mock('resize-observer-polyfill', () => ({ __esModule: true, default: ImmediateResizeObserver }))

/** Height the fixed top menu is laid out at in the resize test, in pixels. */
const NAVBAR_HEIGHT = 52

describe('App', () => {
  beforeEach(() => {
    mockDesktopWidth(true)
    loginAs([UserRole.USER])
    disconnectResizeObserver.mockClear()
  })

  afterEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  test('renders the app with its filter panel', () => {
    // GIVEN a logged-in user
    // WHEN the app renders
    render(<App />)

    // THEN the filter panel is shown
    expect(screen.getByText(/Filters/i)).toBeInTheDocument()
  })

  test('places the filter tab under the top menu once the menu is laid out', () => {
    // GIVEN a logged-in user on a browser that lays the top menu out 52px high
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(NAVBAR_HEIGHT)

    // WHEN the app renders
    render(<App />)

    // THEN the filter tab sits under the menu instead of at the top of the window
    expect(screen.getByRole('button', { name: 'Open filters' }).style.top).toBe('calc(52px + 1.25rem)')
  })

  test('stops watching the top menu size when the app is closed', () => {
    // GIVEN the rendered app
    const { unmount } = render(<App />)

    // WHEN it unmounts
    unmount()

    // THEN its resize observer is disconnected
    expect(disconnectResizeObserver).toHaveBeenCalledTimes(1)
  })

  test('pins the header on desktop widths', () => {
    // GIVEN a desktop-wide window
    // WHEN the app renders
    const { container } = render(<App />)

    // THEN the header stays at the top of the window
    expect(container.querySelector('.navbar')).toHaveClass('is-fixed-top')
  })

  test('lets the header and the filter tab scroll away with the page on narrower screens', () => {
    // GIVEN a phone or tablet window and a top menu laid out 52px high
    mockDesktopWidth(false)
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(NAVBAR_HEIGHT)

    // WHEN the app renders
    const { container } = render(<App />)

    // THEN the header scrolls with the page and the filter tab sits on the page just under it
    expect(container.querySelector('.navbar')).not.toHaveClass('is-fixed-top')
    const tab = screen.getByRole('button', { name: 'Open filters' })
    expect(tab.style.position).toBe('absolute')
    expect(tab.style.top).toBe('calc(52px + 0.5rem)')
  })
})
