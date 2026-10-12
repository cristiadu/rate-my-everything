import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Message } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { Item, RatedItem } from '@/components/types'
import InterestDiscussion from '@/components/interests/InterestDiscussion'
import InterestDetails from '@/components/interests/InterestDetails'
import RatingHistory from '@/components/interests/RatingHistory'
import { getUserIdFromToken } from '@/components/admin/RequireAdmin'
import { useAuth } from '@/components/users/AuthContext'

/** View page of one interest: its details, and the discussion thread everyone shares about it. */
const InterestPage: React.FC = () => {
  const { itemId } = useParams()
  const viewedItemId = Number(itemId)
  const { token } = useAuth()
  const userId = getUserIdFromToken(token)
  const [item, setItem] = useState<Item | null>(null)
  const [itemRatings, setItemRatings] = useState<RatedItem[]>([])
  const [error, setError] = useState('')

  const loadItem = useCallback(async () => {
    try {
      setItem(await ApiService.get<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${viewedItemId}`))
      setItemRatings(await ApiService.get<RatedItem[]>(`${ApiConfig.ENDPOINTS.RATINGS}/item/${viewedItemId}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the interest')
    }
  }, [viewedItemId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

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
      <InterestDetails item={item} />
      <RatingHistory itemRatings={itemRatings} userId={userId} />
      <InterestDiscussion itemId={item.id} />
    </>
  )
}

export default InterestPage
