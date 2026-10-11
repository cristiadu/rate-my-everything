import type { RankingItem, RatedItem } from '@/components/types'

/** Category label for items saved before categories were required. */
const UNCATEGORIZED = 'Uncategorized'

/** Builds a ranking row for a rated item with the given rating. */
const toRankingItem = (ratedItem: RatedItem, rating: number): RankingItem => ({
  item_id: ratedItem.item.id,
  item_name: ratedItem.item.name,
  item_img_url: ratedItem.item.imageUrl,
  category: ratedItem.item.category?.name ?? UNCATEGORIZED,
  rating,
})

/** Sorts ranking rows from the highest rating to the lowest. */
const sortByRating = (rankings: RankingItem[]): RankingItem[] => [...rankings].sort((a, b) => b.rating - a.rating)

/** Turns the signed-in user's ratings into ranking rows, best first. */
export const toMyRankings = (ratings: RatedItem[]): RankingItem[] => sortByRating(
  ratings.map((ratedItem) => toRankingItem(ratedItem, ratedItem.rating)),
)

/** Averages everyone's ratings of each item into one ranking row per item, best first. */
export const toOverallRankings = (ratings: RatedItem[]): RankingItem[] => {
  const ratingsByItem = new Map<number, RatedItem[]>()
  for (const ratedItem of ratings) {
    ratingsByItem.set(ratedItem.item.id, [...(ratingsByItem.get(ratedItem.item.id) ?? []), ratedItem])
  }

  const rankings = [...ratingsByItem.values()].map((itemRatings) => {
    const total = itemRatings.reduce((sum, ratedItem) => sum + ratedItem.rating, 0)
    return toRankingItem(itemRatings[0], total / itemRatings.length)
  })
  return sortByRating(rankings)
}
