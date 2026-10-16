import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Message } from 'react-bulma-components'
import {
  deleteRating, getItem, getRatingsByItem, updateRating, type ItemResponse, type RatedItemResponse, type RatingUpdate,
} from '@/api/generated/api'
import InterestDiscussion from '@/components/interests/InterestDiscussion'
import InterestDetails from '@/components/interests/InterestDetails'
import ItemGrades from '@/components/interests/ItemGrades'
import RatingHistory from '@/components/interests/RatingHistory'
import { getUserIdFromToken } from '@/components/admin/RequireAdmin'
import { useAuth } from '@/components/users/AuthContext'

/** View page of one interest: its details, grades and rating history in one view, and the discussion thread everyone shares about it. */
const InterestPage: React.FC = () => {
  const { itemId } = useParams()
  const viewedItemId = Number(itemId)
  const { token } = useAuth()
  const userId = getUserIdFromToken(token)
  const [item, setItem] = useState<ItemResponse | null>(null)
  const [itemRatings, setItemRatings] = useState<RatedItemResponse[]>([])
  const [error, setError] = useState('')
  /** Error from changing or removing a rating, shown above the view while the interest stays visible. */
  const [actionError, setActionError] = useState('')

  const loadItem = useCallback(async () => {
    try {
      setItem(await getItem(viewedItemId))
      setItemRatings(await getRatingsByItem(viewedItemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the interest')
    }
  }, [viewedItemId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  /** Deletes one of the signed-in user's ratings after confirming, and updates the grades without reloading. */
  const handleRemoveRating = async (ratedItem: RatedItemResponse) => {
    if (!window.confirm(`Remove your ${ratedItem.rating.toFixed(1)} rating of "${item?.name}"?`)) {
      return
    }

    setActionError('')
    try {
      await deleteRating(ratedItem.id)
      setItemRatings(itemRatings.filter((rating) => rating.id !== ratedItem.id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove the rating')
    }
  }

  /** Saves a change to one of the signed-in user's ratings, and updates the grades without reloading. */
  const handleEditRating = async (ratedItem: RatedItemResponse, change: RatingUpdate) => {
    setActionError('')
    try {
      const updated = await updateRating(ratedItem.id, change)
      setItemRatings(itemRatings.map((rating) => (rating.id === ratedItem.id ? { ...rating, ...updated } : rating)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to change the rating')
      throw err
    }
  }

  if (error) {
    return (
      <Message color="danger">
        <Message.Body>{error}</Message.Body>
      </Message>
    )
  }

  if (!item) {
    return null
  }

  return (
    <>
      {actionError && (
        <Message color="danger">
          <Message.Body>{actionError}</Message.Body>
        </Message>
      )}
      <InterestDetails
        item={item}
        grades={(
          <>
            <ItemGrades itemRatings={itemRatings} userId={userId} />
            <div className="has-text-centered">
              <Link
                className="button is-primary is-rounded"
                to={`/interests/${item.id}/edit`}
                aria-label="Add a rating"
                title="Add a rating"
              >
                <span className="is-size-4" aria-hidden="true">+</span>
              </Link>
              <p className="is-size-6 has-text-weight-semibold mt-1" aria-hidden="true">Add a rating</p>
            </div>
          </>
        )}
        history={(
          <RatingHistory
            itemRatings={itemRatings}
            userId={userId}
            onEdit={handleEditRating}
            onRemove={handleRemoveRating}
            isEmbedded
          />
        )}
      />
      <InterestDiscussion itemId={item.id} />
    </>
  )
}

export default InterestPage
