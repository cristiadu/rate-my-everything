import React from 'react'
import { ChangeRequestStatus, type ChangeRequestResponse } from '@/api/generated/api'
import type { ChangeRequestLookups } from '@/components/types'
import { STATUS_TAG_CLASSES, describeChangeRequest, listChanges } from '@/components/moderation/changeRequestText'

/** Props for the change request table; `onReview` adds approve and reject buttons to pending requests. */
interface ChangeRequestListProps {
  changeRequests: ChangeRequestResponse[];
  lookups: ChangeRequestLookups;
  onReview?: (changeRequest: ChangeRequestResponse, decision: ChangeRequestStatus) => void;
}

/** Table of change requests with what each proposes, who sent it and where it is in moderation. */
const ChangeRequestList: React.FC<ChangeRequestListProps> = ({ changeRequests, lookups, onReview }) => (
  <table className="table is-fullwidth is-striped">
    <thead>
      <tr>
        <th>Submitted</th>
        <th>Change</th>
        <th>Proposed values</th>
        <th>Status</th>
        {onReview && <th aria-label="Actions" />}
      </tr>
    </thead>
    <tbody>
      {changeRequests.length === 0 && (
        <tr>
          <td colSpan={onReview ? 5 : 4}>No change requests.</td>
        </tr>
      )}
      {changeRequests.map((changeRequest) => (
        <tr key={changeRequest.id}>
          <td>
            {new Date(changeRequest.createdAt).toLocaleString()}
            <br />
            <span className="is-size-7">by {changeRequest.requestedBy.username}</span>
          </td>
          <td>{describeChangeRequest(changeRequest)}</td>
          <td>
            {listChanges(changeRequest.changes, lookups).map(([label, value]) => (
              <div key={label}>
                <strong>{label}:</strong> {value}
              </div>
            ))}
          </td>
          <td>
            <span className={`tag ${STATUS_TAG_CLASSES[changeRequest.status]}`}>{changeRequest.status}</span>
            {changeRequest.reviewedBy && <div className="is-size-7">by {changeRequest.reviewedBy.username}</div>}
            {changeRequest.reviewNote && <div className="is-size-7">{changeRequest.reviewNote}</div>}
          </td>
          {onReview && (
            <td className="has-text-right">
              {changeRequest.status === ChangeRequestStatus.PENDING && (
                <div className="buttons is-right">
                  <button
                    className="button is-small is-success"
                    type="button"
                    onClick={() => onReview(changeRequest, ChangeRequestStatus.APPROVED)}
                  >
                    Approve
                  </button>
                  <button
                    className="button is-small is-danger"
                    type="button"
                    onClick={() => onReview(changeRequest, ChangeRequestStatus.REJECTED)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
)

export default ChangeRequestList
