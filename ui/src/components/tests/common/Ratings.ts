import { screen, within } from '@testing-library/react'

/** The rows of the rendered rating history, as [rating, notes] text. */
export const historyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)
  .map((row) => within(row).getAllByRole('cell').slice(1, 3).map((cell) => cell.textContent))

/** The big grade box shown above the given label. */
export const gradeBox = (label: string) => screen.getByText(label).previousSibling as HTMLElement
