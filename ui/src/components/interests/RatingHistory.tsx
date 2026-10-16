import React, { useState } from 'react'
import { Box } from 'react-bulma-components'
import type { RatedItemResponse, RatingUpdate } from '@/api/generated/api'
import type { RatingHistoryScope } from '@/components/types'
import ItemGrades from '@/components/interests/ItemGrades'
import { MAX_RATING, MIN_RATING } from '@/components/interests/interestForm'
import { formatDate } from '@/components/common/formatDate'

/** How many of the newest ratings an embedded history shows until it is expanded. */
const COLLAPSED_RATING_COUNT = 3

/** Props for an item's grades and the signed-in user's rating history of it. */
interface RatingHistoryProps {
  /** Every user's ratings of the item, the signed-in user's included. */
  itemRatings: RatedItemResponse[];
  /** Id of the signed-in user, whose ratings are listed. */
  userId: number | null;
  onRemove?: (ratedItem: RatedItemResponse) => void;
  /** Saves a change to one of the signed-in user's ratings; when given, each of their ratings can be edited in place. */
  onEdit?: (ratedItem: RatedItemResponse, change: RatingUpdate) => Promise<void>;
  /**
   * Whether the history is part of a bigger view that shows the grades itself, like the interest page.
   * An embedded history leaves out the grades and its own box, can switch between my ratings and everyone's,
   * and shows only the newest ratings until it is expanded.
   */
  isEmbedded?: boolean;
}

/** Shows an item's personal and collective grades and lists each time the signed-in user rated it, newest first. */
const RatingHistory: React.FC<RatingHistoryProps> = ({ itemRatings, userId, onRemove, onEdit, isEmbedded = false }) => {
  const [scope, setScope] = useState<RatingHistoryScope>('personal')
  const [isExpanded, setExpanded] = useState(false)
  /** The rating being edited in place, with the values typed so far. */
  const [editing, setEditing] = useState<{ id: number, rating: string, notes: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  /** Every time the signed-in user rated the item. */
  const myRatings = itemRatings.filter((ratedItem) => ratedItem.userId === userId)
  /** The ratings the chosen scope lists, newest first. */
  const listedRatings = [...(scope === 'all' ? itemRatings : myRatings)].sort((a, b) => Date.parse(b.ratedAt) - Date.parse(a.ratedAt))
  /** Whether some ratings are hidden until the history is expanded. */
  const canExpand = isEmbedded && listedRatings.length > COLLAPSED_RATING_COUNT
  const shownRatings = canExpand && !isExpanded ? listedRatings.slice(0, COLLAPSED_RATING_COUNT) : listedRatings
  const caption = scope === 'all' ? 'Everyone\'s ratings' : 'My ratings'

  /** Saves the rating being edited, then closes its row's editor. */
  const handleSaveEdit = async (e: React.FormEvent, ratedItem: RatedItemResponse) => {
    e.preventDefault()
    if (!onEdit || !editing) {
      return
    }

    setIsSaving(true)
    try {
      await onEdit(ratedItem, { rating: Number(editing.rating), notes: editing.notes || null })
      setEditing(null)
    } catch {
      // The page shows why the change failed; the editor stays open so it can be tried again
    } finally {
      setIsSaving(false)
    }
  }

  /** One rating's row: read-only, or with inputs while it is being edited. */
  const renderRow = (ratedItem: RatedItemResponse) => {
    const isMine = ratedItem.userId === userId
    if (editing?.id === ratedItem.id) {
      return (
        <tr key={ratedItem.id}>
          <td className="rating-history-nowrap">{formatDate(ratedItem.ratedAt)}</td>
          <td colSpan={3}>
            <form className="field has-addons" aria-label="Edit rating" onSubmit={(e) => handleSaveEdit(e, ratedItem)}>
              <div className="control">
                <input
                  className="input is-small rating-history-grade-input"
                  type="number"
                  aria-label="Rating"
                  min={MIN_RATING}
                  max={MAX_RATING}
                  step="0.1"
                  value={editing.rating}
                  onChange={(e) => setEditing({ ...editing, rating: e.target.value })}
                  required
                />
              </div>
              <div className="control is-expanded">
                <input
                  className="input is-small"
                  aria-label="Notes"
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
              <div className="control">
                <button type="submit" className={`button is-small is-primary${isSaving ? ' is-loading' : ''}`} disabled={isSaving}>
                  Save
                </button>
              </div>
              <div className="control">
                <button type="button" className="button is-small" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </td>
        </tr>
      )
    }

    return (
      <tr key={ratedItem.id}>
        <td className="rating-history-nowrap">{formatDate(ratedItem.ratedAt)}</td>
        <td className="rating-history-nowrap">
          {ratedItem.rating.toFixed(1)}
          {scope === 'all' && isMine && <span className="tag is-info ml-2">Mine</span>}
        </td>
        <td>{ratedItem.notes}</td>
        {(onEdit || onRemove) && (
          <td className="has-text-right">
            {isMine && (
              <div className="buttons is-right are-small is-flex-wrap-nowrap">
                {onEdit && (
                  <button
                    type="button"
                    className="button is-small is-primary is-outlined"
                    onClick={() => setEditing({ id: ratedItem.id, rating: String(ratedItem.rating), notes: ratedItem.notes ?? '' })}
                  >
                    Edit
                  </button>
                )}
                {onRemove && (
                  <button type="button" className="button is-small is-danger is-outlined" onClick={() => onRemove(ratedItem)}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </td>
        )}
      </tr>
    )
  }

  const history = (
    <>
      {isEmbedded && (
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h3 className="title is-5">History</h3>
          </div>
          <div className="level-right">
            <div className="buttons has-addons are-small">
              <button
                type="button"
                className={`button${scope === 'personal' ? ' is-primary is-selected' : ''}`}
                aria-pressed={scope === 'personal'}
                onClick={() => setScope('personal')}
              >
                Personal
              </button>
              <button
                type="button"
                className={`button${scope === 'all' ? ' is-primary is-selected' : ''}`}
                aria-pressed={scope === 'all'}
                onClick={() => setScope('all')}
              >
                All
              </button>
            </div>
          </div>
        </div>
      )}
      <table className="table is-fullwidth is-striped is-hoverable">
        <caption className={isEmbedded ? 'is-sr-only' : 'has-text-left has-text-weight-semibold'}>{caption}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rating</th>
            <th>Notes</th>
            {(onEdit || onRemove) && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {shownRatings.map(renderRow)}
        </tbody>
      </table>
      {isEmbedded && listedRatings.length === 0 && (
        <p className="has-text-grey">{scope === 'all' ? 'Nobody rated it yet.' : 'You have not rated it yet.'}</p>
      )}
      {canExpand && (
        <button type="button" className="button is-small is-text" onClick={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Show fewer' : `Show all ${listedRatings.length} ratings`}
        </button>
      )}
    </>
  )

  if (isEmbedded) {
    return <section aria-label="Rating history">{history}</section>
  }

  return (
    <Box>
      <ItemGrades itemRatings={itemRatings} userId={userId} />
      {history}
    </Box>
  )
}

export default RatingHistory
