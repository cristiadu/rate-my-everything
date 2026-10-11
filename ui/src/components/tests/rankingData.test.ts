import { toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'
import {
  alienRating, duneRating, duneRerating, otherUserDuneRating,
} from '@/components/tests/common/Interests'

test('lists my ratings best first', () => {
  // GIVEN two of my ratings, the lower one first
  const ratings = [alienRating, duneRating]

  // WHEN they become ranking rows
  const rankings = toMyRankings(ratings)

  // THEN the higher rating comes first with its item details
  expect(rankings).toEqual([
    {
      item_id: 100, item_name: 'Dune', item_img_url: 'https://example.com/dune.png', category: 'Books', rating: 9.5, rating_count: 1,
    },
    {
      item_id: 101, item_name: 'Alien', item_img_url: null, category: 'Movies', rating: 7, rating_count: 1,
    },
  ])
})

test('averages each time I rated an item into my personal grade', () => {
  // GIVEN I rated Dune twice, 9.5 and then 8.5
  const ratings = [duneRating, duneRerating]

  // WHEN they become ranking rows
  const rankings = toMyRankings(ratings)

  // THEN Dune shows once with my personal grade from both ratings
  expect(rankings.map((ranking) => [ranking.item_name, ranking.rating, ranking.rating_count])).toEqual([['Dune', 9, 2]])
})

test('averages each user\'s personal grade into the collective grade', () => {
  // GIVEN I rated Dune twice (9.5 and 8.5), another user rated it 6, and Alien got a 7
  const ratings = [duneRating, alienRating, duneRerating, otherUserDuneRating]

  // WHEN they become overall ranking rows
  const rankings = toOverallRankings(ratings)

  // THEN Dune's grade averages my 9 and their 6, so rating it twice still counts once
  expect(rankings.map((ranking) => [ranking.item_name, ranking.rating, ranking.rating_count])).toEqual([['Dune', 7.5, 3], ['Alien', 7, 1]])
})

test('labels items without a category', () => {
  const ratings = [{ ...alienRating, item: { ...alienRating.item, category: null } }]

  expect(toMyRankings(ratings)[0].category).toBe('Uncategorized')
})
