import type { RatedItemResponse } from '@/api/generated/api'
import type { GradeColor, RankingItem } from '@/components/types'

/** Groups ratings by the key each one maps to, keeping the order they came in. */
const groupRatings = (ratings: RatedItemResponse[], keyOf: (ratedItem: RatedItemResponse) => number): RatedItemResponse[][] => {
  const groups = new Map<number, RatedItemResponse[]>()
  for (const ratedItem of ratings) {
    groups.set(keyOf(ratedItem), [...(groups.get(keyOf(ratedItem)) ?? []), ratedItem])
  }
  return [...groups.values()]
}

/** Averages a list of grades. */
const average = (grades: number[]): number => grades.reduce((sum, grade) => sum + grade, 0) / grades.length

/** Personal grade: the average of every time the given user rated, or null when they gave no rating. */
export const personalGrade = (ratings: RatedItemResponse[], userId: number | null): number | null => {
  const userRatings = ratings.filter((ratedItem) => ratedItem.userId === userId)
  return userRatings.length > 0 ? average(userRatings.map((ratedItem) => ratedItem.rating)) : null
}

/** The rating a user gave most recently out of their ratings of one item. */
const latestRating = (userRatings: RatedItemResponse[]): RatedItemResponse => userRatings
  .reduce((latest, ratedItem) => (Date.parse(ratedItem.ratedAt) > Date.parse(latest.ratedAt) ? ratedItem : latest))

/** Collective grade: the average of each user's latest rating, so only the last time a user rated an item counts. */
export const collectiveGrade = (ratings: RatedItemResponse[]): number => average(
  groupRatings(ratings, (ratedItem) => ratedItem.userId).map((userRatings) => latestRating(userRatings).rating),
)

/** How many users rated the item, which is how many ratings the collective grade counts. */
export const raterCount = (ratings: RatedItemResponse[]): number => new Set(ratings.map((ratedItem) => ratedItem.userId)).size

/** Builds one ranking row per rated item, with its collective grade and the given user's personal grade. */
const toRankingItems = (ratings: RatedItemResponse[], userId: number | null): RankingItem[] => (
  groupRatings(ratings, (ratedItem) => ratedItem.item.id).map((itemRatings) => ({
    item: itemRatings[0].item,
    rating: collectiveGrade(itemRatings),
    myRating: personalGrade(itemRatings, userId),
    ratingCount: itemRatings.length,
  }))
)

/** Lists the items the given user rated, best personal grade first, each with its collective grade too. */
export const toMyRankings = (ratings: RatedItemResponse[], userId: number | null): RankingItem[] => toRankingItems(ratings, userId)
  .filter((ranking) => ranking.myRating !== null)
  .sort((a, b) => (b.myRating ?? 0) - (a.myRating ?? 0))

/** Lists every rated item, best collective grade first, each with the given user's personal grade too. */
export const toOverallRankings = (ratings: RatedItemResponse[], userId: number | null): RankingItem[] => toRankingItems(ratings, userId)
  .sort((a, b) => b.rating - a.rating)

/** Lowest grade shown in green as a good grade. */
const GOOD_GRADE = 7

/** Lowest grade shown in yellow as an average grade; lower grades are shown in red. */
const AVERAGE_GRADE = 4

/** Picks the color a grade is shown in: green from 7, yellow from 4, red below that, and grey when there is no grade. */
export const gradeColor = (grade: number | null): GradeColor => {
  if (grade === null) {
    return 'light'
  }
  if (grade >= GOOD_GRADE) {
    return 'success'
  }
  return grade >= AVERAGE_GRADE ? 'warning' : 'danger'
}
