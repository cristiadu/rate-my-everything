import ChangeRequestStatus from '@/models/ChangeRequestStatus'

/** Raised when a moderator reviews a change request that was already approved or rejected. */
export class ChangeRequestNotPending extends Error {
    constructor(changeRequestId: number, status: ChangeRequestStatus) {
        super(`Change request ${changeRequestId} is already ${status}`)
        this.name = 'ChangeRequestNotPending'
    }
}
