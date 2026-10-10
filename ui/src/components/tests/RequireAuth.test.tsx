import { fireEvent, screen } from '@testing-library/react'
import UserRole from '@/components/users/UserRole'
import { makeToken, signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('RequireAuth', () => {
  test('asks signed-out visitors to log in with the header form', () => {
    // GIVEN no stored token

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByText('Log in required')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  test('shows the page once the visitor logs in with the header form', async () => {
    // GIVEN
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: makeToken([UserRole.USER], { username: 'regular' }) }),
    }) as jest.Mock
    renderAppAt('/account')

    // WHEN
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'regular' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByText('Log In'))

    // THEN
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.queryByText('Log in required')).not.toBeInTheDocument()
  })

  test('shows Not authorized to a user without the required role', () => {
    // GIVEN
    signInAs([UserRole.USER])

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByText('Not authorized')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  test('lets a user with the required role in', () => {
    // GIVEN
    signInAs([UserRole.ADMIN], { username: 'boss' })

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByRole('heading', { name: 'Admin Area' })).toBeInTheDocument()
    expect(screen.getByText('Signed in as boss')).toBeInTheDocument()
  })

  test('lets any signed-in user into a page with no role requirement', () => {
    // GIVEN
    signInAs([UserRole.USER], { username: 'regular' })

    // WHEN
    renderAppAt('/account')

    // THEN
    expect(screen.getByRole('heading', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.getByText('Username: regular')).toBeInTheDocument()
  })
})
