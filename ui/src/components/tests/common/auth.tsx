import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/components/users/AuthContext'

// Builds an unsigned JWT-shaped token carrying the given roles, as the UI only reads the payload
export const makeTestToken = (roles: string[]): string => {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode({ id: 1, roles })}.signature`
}

export const renderAsUser = (ui: React.ReactElement, roles: string[]) => {
  localStorage.setItem('authToken', makeTestToken(roles))
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  )
}
