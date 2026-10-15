import React, { useCallback, useEffect, useState } from 'react'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { ChangeRequest } from '@/components/types'
import ChangeRequestList from '@/components/moderation/ChangeRequestList'
import { useChangeRequestLookups } from '@/components/moderation/useChangeRequestLookups'

/** Screen where users follow the changes they proposed and see what moderators decided. */
const MyChangeRequestsPage: React.FC = () => {
  const lookups = useChangeRequestLookups()
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [error, setError] = useState('')

  /** Fetches the signed-in user's change requests. */
  const loadChangeRequests = useCallback(async () => {
    try {
      setChangeRequests(await ApiService.get<ChangeRequest[]>(ApiConfig.ENDPOINTS.CHANGE_REQUESTS))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your change requests')
    }
  }, [])

  useEffect(() => {
    loadChangeRequests()
  }, [loadChangeRequests])

  return (
    <div className="box">
      <h2 className="title is-4">My change requests</h2>
      <p className="mb-4">Changes you proposed to shared interests and categories apply once a moderator approves them.</p>
      {error && <div className="notification is-danger">{error}</div>}
      <ChangeRequestList changeRequests={changeRequests} lookups={lookups} />
    </div>
  )
}

export default MyChangeRequestsPage
