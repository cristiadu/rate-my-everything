import React from 'react'
import { Box } from 'react-bulma-components'
import type { RatedItem } from '@/components/types'
import { collectiveGrade, personalGrade } from '@/components/rankings/rankingData'

/** Props for an item's grades and the signed-in user's rating history of it. */
interface RatingHistoryProps {
  /** Every user's ratings of the item, the signed-in user's included. */
  itemRatings: RatedItem[];
  /** Id of the signed-in user, whose ratings are listed. */
  userId: number | null;
  onRemove: (ratedItem: RatedItem) => void;
}

/** Shows an item's personal and collective grades and lists each time the signed-in user rated it, newest first. */
const RatingHistory: React.FC<RatingHistoryProps> = ({ itemRatings, userId, onRemove }) => {
  /** Every time the signed-in user rated the item. */
  const myRatings = itemRatings.filter((ratedItem) => ratedItem.userId === userId)

  return (
    <Box>
      <nav className="level">
        <div className="level-item has-text-centered">
          <div>
            <p className="heading">My grade</p>
            <p className="title">{personalGrade(itemRatings, userId)?.toFixed(1)}</p>
            <p>{`from ${myRatings.length} of my ratings`}</p>
          </div>
        </div>
        <div className="level-item has-text-centered">
          <div>
            <p className="heading">Everyone&apos;s grade</p>
            <p className="title">{collectiveGrade(itemRatings).toFixed(1)}</p>
            <p>{`from ${itemRatings.length} ratings`}</p>
          </div>
        </div>
      </nav>
      <table className="table is-fullwidth is-striped is-hoverable">
        <caption className="has-text-left has-text-weight-semibold">My ratings</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rating</th>
            <th>Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {[...myRatings].sort((a, b) => Date.parse(b.ratedAt) - Date.parse(a.ratedAt)).map((ratedItem) => (
            <tr key={ratedItem.id}>
              <td>{new Date(ratedItem.ratedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
              <td>{ratedItem.rating.toFixed(1)}</td>
              <td>{ratedItem.notes}</td>
              <td>
                <button type="button" className="button is-small is-danger is-outlined" onClick={() => onRemove(ratedItem)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}

export default RatingHistory
