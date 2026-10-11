import { personalGrade, toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'
import {
  alienRating, duneRating, duneRerating, otherUserDuneRating,
} from '@/components/tests/common/Interests'

/** Id of the signed-in user in the shared rating fixtures. */
const MY_USER_ID = 1

/** My two Dune ratings (9.5 and 8.5), another user's Dune rating (6) and another user's Alien rating (7). */
const ratings = [alienRating, duneRating, duneRerating, otherUserDuneRating]

test('lists only the items I rated, with my grade and everyone\'s grade', () => {
  // GIVEN everyone's ratings, where I only rated Dune
  // WHEN they become my ranking rows
  const rankings = toMyRankings(ratings, MY_USER_ID)

  // THEN Dune shows my average of 9 next to everyone's grade, and Alien is left out
  expect(rankings).toEqual([{
    item_id: 100,
    item_name: 'Dune',
    item_img_url: 'https://example.com/dune.png',
    category: 'Books',
    rating: 7.5,
    my_rating: 9,
    rating_count: 3,
  }])
})

test('averages each user\'s personal grade into the collective grade', () => {
  // GIVEN everyone's ratings
  // WHEN they become overall ranking rows
  const rankings = toOverallRankings(ratings, MY_USER_ID)

  // THEN Dune averages my 9 and their 6, so rating it twice still counts once, and I have no grade for Alien
  expect(rankings.map((ranking) => [ranking.item_name, ranking.rating, ranking.my_rating, ranking.rating_count])).toEqual([
    ['Dune', 7.5, 9, 3],
    ['Alien', 7, null, 1],
  ])
})

test('works out a personal grade from one user\'s ratings only', () => {
  // GIVEN everyone's ratings of Dune
  const duneRatings = [duneRating, duneRerating, otherUserDuneRating]

  // WHEN the grades of me, the other user and a user who never rated it are worked out
  const grades = [personalGrade(duneRatings, MY_USER_ID), personalGrade(duneRatings, 2), personalGrade(duneRatings, 3)]

  // THEN each grade only uses that user's ratings
  expect(grades).toEqual([9, 6, null])
})

test('labels items without a category', () => {
  // GIVEN my rating of an item saved without a category
  const uncategorized = [{ ...duneRating, item: { ...duneRating.item, category: null } }]

  // WHEN it becomes a ranking row
  // THEN its category reads Uncategorized
  expect(toMyRankings(uncategorized, MY_USER_ID)[0].category).toBe('Uncategorized')
})
