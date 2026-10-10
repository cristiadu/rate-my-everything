import React from 'react'
import { render } from '@testing-library/react'
import App from '@/components/App'

/** Renders the whole app at the given path. */
export const renderAppAt = (path: string) => {
  window.history.pushState({}, '', path)
  return render(<App />)
}
