import React from 'react'
import { render, screen } from '@testing-library/react'
import Index from '@/components/index/Index'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { loginAs } from '@/components/tests/common/Auth'

/** Renders the home page inside the auth context, as the app does. */
const renderIndex = () => render(
  <AuthProvider>
    <Index />
  </AuthProvider>,
)

describe('Index', () => {
  afterEach(() => {
    localStorage.clear()
  })

  test('tells visitors what the app does and where to log in or sign up', () => {
    // GIVEN a visitor who is not logged in
    // WHEN the home page renders
    renderIndex()

    // THEN it explains the app, shows a sample of each grade color and links to the sign-up page and points to the header's login
    expect(screen.getByRole('heading', { name: 'Rate anything' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Change your mind' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Compare with everyone' })).toBeInTheDocument()
    expect(screen.getByText('8.5').parentElement).toHaveClass('is-success')
    expect(screen.getByText('5.5').parentElement).toHaveClass('is-warning')
    expect(screen.getByText('2.0').parentElement).toHaveClass('is-danger')
    expect(screen.getByText('7 and up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
    expect(screen.getByText(/Log in at the top of the page/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My interests' })).not.toBeInTheDocument()
  })

  test('links logged-in users to their interests instead of the login hint', () => {
    // GIVEN a logged-in user
    loginAs([UserRole.USER])

    // WHEN the home page renders
    renderIndex()

    // THEN it links to their interests and to adding one, without the login hint
    expect(screen.getByRole('link', { name: 'My interests' })).toHaveAttribute('href', '/rankings')
    expect(screen.getByRole('link', { name: 'Add an interest' })).toHaveAttribute('href', '/interests/new')
    expect(screen.queryByText(/Log in at the top of the page/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument()
  })
})
