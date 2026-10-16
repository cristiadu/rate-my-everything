import { gradeColor, personalGrade, toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'
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

  // THEN Dune shows my average of 9 next to everyone's grade from my latest 8.5 and their 6, and Alien is left out
  expect(rankings).toEqual([{ item: duneRating.item, rating: 7.25, myRating: 9, ratingCount: 3 }])
})

test('averages each user\'s latest rating into the collective grade', () => {
  // GIVEN everyone's ratings
  // WHEN they become overall ranking rows
  const rankings = toOverallRankings(ratings, MY_USER_ID)

  // THEN Dune averages my latest 8.5 and their 6, so only my last rating counts, and I have no grade for Alien
  expect(rankings.map((ranking) => [ranking.item.name, ranking.rating, ranking.myRating, ranking.ratingCount])).toEqual([
    ['Dune', 7.25, 9, 3],
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

test('colors grades green from 7, yellow from 4, red below that and grey when there is none', () => {
  // GIVEN grades on each side of the color thresholds, and no grade
  const grades = [10, 7, 6.9, 4, 3.9, 0, null]

  // WHEN each one gets its color
  const colors = grades.map(gradeColor)

  // THEN good grades are green, average ones yellow, bad ones red and a missing grade grey
  expect(colors).toEqual(['success', 'success', 'warning', 'warning', 'danger', 'danger', 'light'])
})
