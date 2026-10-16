import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RankingTableItem from '@/components/rankings/RankingTableItem'
import { duneRating } from '@/components/tests/common/Interests'

test('labels items without a category', () => {
  // GIVEN a ranking row for an item saved without a category
  const ranking = { item: { ...duneRating.item, category: null }, rating: 7.5, myRating: 9, ratingCount: 3 }

  // WHEN the row is shown
  render(
    <MemoryRouter>
      <table><tbody><RankingTableItem ranking={ranking} canEdit={false} /></tbody></table>
    </MemoryRouter>,
  )

  // THEN its category reads Uncategorized
  expect(screen.getByText('Uncategorized')).toBeInTheDocument()
})
