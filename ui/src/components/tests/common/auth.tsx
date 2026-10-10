import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'

/** Base64url-encodes a JSON value without padding, as JWT segments are. */
const encodeTokenSegment = (value: object): string => btoa(JSON.stringify(value)).replace(/=+$/, '')

/** Renders a component inside the auth context and a router, signed in with an unsigned token holding the given roles. */
export const renderAsUser = (ui: React.ReactElement, roles: UserRole[]) => {
  const token = `${encodeTokenSegment({ alg: 'none' })}.${encodeTokenSegment({ id: 1, roles })}.signature`
  localStorage.setItem('authToken', token)
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  )
}
