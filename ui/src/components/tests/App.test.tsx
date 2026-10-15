import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '@/components/App'

test('renders the app with its filter panel', () => {
  // GIVEN the app
  // WHEN it renders
  render(<App />)

  // THEN the filter panel is shown
  expect(screen.getByText(/Filters/i)).toBeInTheDocument()
})
