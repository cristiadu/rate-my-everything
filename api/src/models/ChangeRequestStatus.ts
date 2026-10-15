/** Where a change request is in moderation. */
enum ChangeRequestStatus {
    /** Waiting for a moderator; nothing has changed yet. */
    PENDING = 'pending',
    /** A moderator accepted it and the change was applied. */
    APPROVED = 'approved',
    /** A moderator turned it down; nothing changed. */
    REJECTED = 'rejected',
}

export default ChangeRequestStatus
