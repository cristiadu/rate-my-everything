import { toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'
import { alienRating, duneRating } from '@/components/tests/common/Interests'

test('lists my ratings best first', () => {
  // GIVEN two of my ratings, the lower one first
  const ratings = [alienRating, duneRating]

  // WHEN they become ranking rows
  const rankings = toMyRankings(ratings)

  // THEN the higher rating comes first with its item details
  expect(rankings).toEqual([
    { item_id: 100, item_name: 'Dune', item_img_url: 'https://example.com/dune.png', category: 'Books', rating: 9.5 },
    { item_id: 101, item_name: 'Alien', item_img_url: null, category: 'Movies', rating: 7 },
  ])
})

test('averages everyone\'s ratings into one row per item', () => {
  // GIVEN two users rated Dune and one rated Alien
  const ratings = [duneRating, alienRating, { ...duneRating, id: 902, rating: 6.5 }]

  // WHEN they become overall ranking rows
  const rankings = toOverallRankings(ratings)

  // THEN Dune shows the average of its two ratings
  expect(rankings.map((ranking) => [ranking.item_name, ranking.rating])).toEqual([['Dune', 8], ['Alien', 7]])
})

test('labels items without a category', () => {
  const ratings = [{ ...alienRating, item: { ...alienRating.item, category: null } }]

  expect(toMyRankings(ratings)[0].category).toBe('Uncategorized')
})
