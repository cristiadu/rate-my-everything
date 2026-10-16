import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import RatingHistory from '@/components/interests/RatingHistory'
import {
  MY_USER_ID, duneFirstRating, duneRating, duneRerating, otherUserDuneRating,
} from '@/components/tests/common/Interests'
import { gradeBox, historyRows } from '@/components/tests/common/Ratings'

describe('RatingHistory', () => {
  test('shows my grades and my ratings in its own box when it is not embedded', () => {
    // GIVEN I rated Dune 9.5 and 8.5 and another user rated it 6
    // WHEN the history renders on its own
    render(<RatingHistory itemRatings={[duneRating, duneRerating, otherUserDuneRating]} userId={MY_USER_ID} />)

    // THEN the grades and a visible caption are shown, my ratings are listed newest first, and there are no actions
    expect(gradeBox('My grade')).toHaveTextContent('9.0')
    expect(screen.getByText('My ratings')).toHaveClass('has-text-weight-semibold')
    expect(historyRows()).toEqual([['8.5', 'Slower the second time'], ['9.5', 'Reread every year']])
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('switches back from everyone\'s ratings to mine', () => {
    // GIVEN an embedded history listing everyone's ratings of Dune
    render(<RatingHistory itemRatings={[duneRating, otherUserDuneRating]} userId={MY_USER_ID} isEmbedded />)
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(historyRows()).toEqual([['6.0', ''], ['9.5Mine', 'Reread every year']])

    // WHEN Personal is chosen
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }))

    // THEN only my rating is listed again
    expect(screen.getByRole('button', { name: 'Personal' })).toHaveAttribute('aria-pressed', 'true')
    expect(historyRows()).toEqual([['9.5', 'Reread every year']])
  })

  test('tells when nobody rated the item yet', () => {
    // GIVEN an embedded history of an item without ratings
    render(<RatingHistory itemRatings={[]} userId={MY_USER_ID} isEmbedded />)

    // WHEN everyone's ratings are chosen
    fireEvent.click(screen.getByRole('button', { name: 'All' }))

    // THEN it says nobody rated it
    expect(screen.getByText('Nobody rated it yet.')).toBeInTheDocument()
  })

  test('collapses an expanded history back to the newest ratings', () => {
    // GIVEN an embedded history of my four ratings, expanded
    const ratings = [duneFirstRating, duneRating, duneRerating, { ...duneRating, id: 905, ratedAt: '2026-10-10T10:00:00.000Z' }]
    render(<RatingHistory itemRatings={ratings} userId={MY_USER_ID} isEmbedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Show all 4 ratings' }))
    expect(historyRows()).toHaveLength(4)

    // WHEN Show fewer is clicked
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer' }))

    // THEN only the three newest ratings are listed
    expect(historyRows()).toHaveLength(3)
    expect(screen.queryByText('Hard to get into')).not.toBeInTheDocument()
  })

  test('cancels editing a rating without saving it', () => {
    // GIVEN my rating of Dune being edited
    const onEdit = jest.fn()
    render(<RatingHistory itemRatings={[duneRating]} userId={MY_USER_ID} onEdit={onEdit} isEmbedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Rating' }), { target: { value: '3' } })

    // WHEN the edit is cancelled
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the row shows the unchanged rating and nothing is saved
    expect(screen.queryByRole('form', { name: 'Edit rating' })).not.toBeInTheDocument()
    expect(historyRows()).toEqual([['9.5', 'Reread every year']])
    expect(onEdit).not.toHaveBeenCalled()
  })

  test('saves emptied notes as no notes', async () => {
    // GIVEN my rating of Dune being edited
    const onEdit = jest.fn().mockResolvedValue(undefined)
    render(<RatingHistory itemRatings={[duneRating]} userId={MY_USER_ID} onEdit={onEdit} isEmbedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    // WHEN its notes are cleared and it is saved
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    // THEN the change is handed on with null notes and the editor closes
    expect(onEdit).toHaveBeenCalledWith(duneRating, { rating: 9.5, notes: null })
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })
})
