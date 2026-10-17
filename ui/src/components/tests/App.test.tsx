import React from 'react'
import { render, screen } from '@testing-library/react'
import { ImmediateResizeObserver } from '@/components/tests/common/ResizeObserver'
import { loginAs } from '@/components/tests/common/Auth'
import App from '@/components/App'
import { UserRole } from '@/api/generated/api'

jest.mock('resize-observer-polyfill', () => ({ __esModule: true, default: ImmediateResizeObserver }))

/** Height the fixed top menu is laid out at in the resize test, in pixels. */
const NAVBAR_HEIGHT = 52

describe('App', () => {
  beforeEach(() => {
    loginAs([UserRole.USER])
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
})
