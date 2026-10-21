import { screen } from '@testing-library/react'

/** Finds the input in the same Bulma field as the label with the given text, for forms whose labels have no htmlFor. */
export const inputUnderLabel = (labelText: string) => {
  const field = screen.getByText(labelText, { selector: 'label' }).closest('.field')
  const input = field?.querySelector('input')
  if (!input) {
    throw new Error(`No input under the label "${labelText}"`)
  }
  return input
}
