import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'

/**
 * Raised when a user changes a rating they did not give, or deletes one without being its author or a moderator.
 * It is a rejected request, so the error handler answers it with 403 and controllers need no try/catch.
 */
export class RatingNotOwned extends RequestRejected {
    constructor(ratingId: number) {
        super(NewApiError(
            ErrorCode.FORBIDDEN, 403, `Only the author can change rating ${ratingId}, and only the author or a moderator can delete it`,
        ))
        this.name = 'RatingNotOwned'
    }
}
