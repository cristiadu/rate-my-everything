import React, { useCallback, useEffect, useState } from 'react'
import {
  ChangeRequestStatus, approveChangeRequest, getChangeRequests, rejectChangeRequest, type ChangeRequestResponse,
} from '@/api/generated/api'
import type { StatusMessage } from '@/components/types'
import ChangeRequestList from '@/components/moderation/ChangeRequestList'
import { describeChangeRequest } from '@/components/moderation/changeRequestText'
import { useChangeRequestLookups } from '@/components/moderation/useChangeRequestLookups'

/** Filter value that lists change requests of every status. */
const ALL_STATUSES = 'all'

/** Screen where admins and moderators review the changes users proposed to interests and categories. */
const ModerationPage: React.FC = () => {
  const lookups = useChangeRequestLookups()
  const [changeRequests, setChangeRequests] = useState<ChangeRequestResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<string>(ChangeRequestStatus.PENDING)
  const [status, setStatus] = useState<StatusMessage>(null)

  /** Fetches the change requests matching the status filter. */
  const loadChangeRequests = useCallback(async () => {
    const params = statusFilter === ALL_STATUSES ? {} : { status: statusFilter as ChangeRequestStatus }
    try {
      setChangeRequests(await getChangeRequests(params))
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load change requests', isSuccess: false })
    }
  }, [statusFilter])

  useEffect(() => {
    loadChangeRequests()
  }, [loadChangeRequests])

  /** Approves or rejects a request with an optional note for its author, then reloads the list. */
  const handleReview = async (changeRequest: ChangeRequestResponse, decision: ChangeRequestStatus) => {
    const verb = decision === ChangeRequestStatus.APPROVED ? 'Approve' : 'Reject'
    const reviewNote = window.prompt(
      `${verb} ${describeChangeRequest(changeRequest)}? Add an optional note for ${changeRequest.requestedBy.username}.`,
    )
    if (reviewNote === null) {
      return
    }

    setStatus(null)
    try {
      const review = decision === ChangeRequestStatus.APPROVED ? approveChangeRequest : rejectChangeRequest
      await review(changeRequest.id, { reviewNote })
      setStatus({ message: `${describeChangeRequest(changeRequest)} ${decision}.`, isSuccess: true })
      await loadChangeRequests()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to review the change request', isSuccess: false })
    }
  }

  return (
    <div className="box">
      <h2 className="title is-4">Moderation</h2>
      <p className="mb-4">Changes users propose to interests and categories wait here until a moderator approves or rejects them.</p>

      {status && (
        <div className={`notification ${status.isSuccess ? 'is-success' : 'is-danger'}`} role="status">
          {status.message}
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="moderation-status">Show</label>
        <div className="control">
          <div className="select">
            <select id="moderation-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {Object.values(ChangeRequestStatus).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
              <option value={ALL_STATUSES}>all</option>
            </select>
          </div>
        </div>
      </div>

      <ChangeRequestList changeRequests={changeRequests} lookups={lookups} onReview={handleReview} />
    </div>
  )
}

export default ModerationPage
