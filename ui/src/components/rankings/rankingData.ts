import type { RankingItem, RatedItem } from '@/components/types'

/** Category label for items saved before categories were required. */
const UNCATEGORIZED = 'Uncategorized'

/** Builds a ranking row for a rated item with the given grade and number of ratings. */
const toRankingItem = (ratedItem: RatedItem, rating: number, ratingCount: number): RankingItem => ({
  item_id: ratedItem.item.id,
  item_name: ratedItem.item.name,
  item_img_url: ratedItem.item.imageUrl,
  category: ratedItem.item.category?.name ?? UNCATEGORIZED,
  rating,
  rating_count: ratingCount,
})

/** Sorts ranking rows from the highest rating to the lowest. */
const sortByRating = (rankings: RankingItem[]): RankingItem[] => [...rankings].sort((a, b) => b.rating - a.rating)

/** Groups ratings by the key each one maps to, keeping the order they came in. */
const groupRatings = (ratings: RatedItem[], keyOf: (ratedItem: RatedItem) => number): RatedItem[][] => {
  const groups = new Map<number, RatedItem[]>()
  for (const ratedItem of ratings) {
    groups.set(keyOf(ratedItem), [...(groups.get(keyOf(ratedItem)) ?? []), ratedItem])
  }
  return [...groups.values()]
}

/** Averages a list of grades. */
const average = (grades: number[]): number => grades.reduce((sum, grade) => sum + grade, 0) / grades.length

/** Personal grade: the average of every time one user rated an item. */
export const personalGrade = (ratings: RatedItem[]): number => average(ratings.map((ratedItem) => ratedItem.rating))

/** Collective grade: the average of each user's personal grade, so rating an item many times still counts once. */
export const collectiveGrade = (ratings: RatedItem[]): number => average(
  groupRatings(ratings, (ratedItem) => ratedItem.userId).map(personalGrade),
)

/** Turns the signed-in user's ratings into one row per item with its personal grade, best first. */
export const toMyRankings = (ratings: RatedItem[]): RankingItem[] => sortByRating(
  groupRatings(ratings, (ratedItem) => ratedItem.item.id)
    .map((itemRatings) => toRankingItem(itemRatings[0], personalGrade(itemRatings), itemRatings.length)),
)

/** Turns everyone's ratings into one row per item with its collective grade, best first. */
export const toOverallRankings = (ratings: RatedItem[]): RankingItem[] => sortByRating(
  groupRatings(ratings, (ratedItem) => ratedItem.item.id)
    .map((itemRatings) => toRankingItem(itemRatings[0], collectiveGrade(itemRatings), itemRatings.length)),
)

