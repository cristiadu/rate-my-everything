import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'

describe('Footer', () => {
  test('shows the app name, tagline and copyright for this year', () => {
    // GIVEN the footer
    // WHEN it renders
    render(<Footer />)

    // THEN the app is named with its tagline and this year's copyright
    expect(screen.getByText('Rate My Everything')).toBeInTheDocument()
    expect(screen.getByText(/Personal ratings, not crowd scores/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Cristiano Faustino`))).toBeInTheDocument()
  })

  test('links to the source code in a new tab', () => {
    // GIVEN the footer
    // WHEN it renders
    render(<Footer />)

    // THEN the repository is linked and opens in a new tab
    const link = screen.getByText('Source on GitHub').closest('a')
    expect(link).toHaveAttribute('href', 'https://github.com/cristiadu/rate-my-everything')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
