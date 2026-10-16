import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, withAuth } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { loginAs } from '@/components/tests/common/Auth'

/** Props of the page guarded in these tests. */
type GreetingProps = { greeting: string }

/** Page that shows the greeting it is given. */
const Greeting = ({ greeting }: GreetingProps) => <p>{greeting}</p>

/** The greeting page, shown only to signed-in users. */
const GuardedGreeting = withAuth(Greeting)

/** Renders the guarded page at /secret, with a stand-in for the login page it redirects to. */
const renderGuardedPage = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/secret" element={<GuardedGreeting greeting="Welcome back" />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('withAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('sends logged-out visitors to the login page', () => {
    // GIVEN nobody is logged in
    // WHEN the guarded page opens
    renderGuardedPage()

    // THEN the login page is shown instead
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument()
  })

  test('shows the page with its props to signed-in users', () => {
    // GIVEN a user is logged in
    loginAs([UserRole.USER])

    // WHEN the guarded page opens
    renderGuardedPage()

    // THEN the page is shown with the greeting it was given
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  test('names the guarded component after the one it wraps', () => {
    // GIVEN a component with a display name, a named function component and an anonymous one
    const Labelled = Object.assign(() => null, { displayName: 'Labelled' })

    // WHEN each one is guarded
    const names = [withAuth(Labelled), withAuth(Greeting), withAuth(() => null)].map((guarded) => guarded.displayName)

    // THEN each name comes from the display name, then the function name, then a generic name
    expect(names).toEqual(['WithAuth(Labelled)', 'WithAuth(Greeting)', 'WithAuth(Component)'])
  })
})
