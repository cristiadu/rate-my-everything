import APIError from '@/models/APIError'

/** Raised to stop a request and answer it with an API error, such as a missing token or a role that is not allowed. */
export class RequestRejected extends Error {
    /** Error sent back to the client, with its HTTP status. */
    public readonly apiError: APIError

    constructor(apiError: APIError) {
        super(apiError.message)
        this.name = 'RequestRejected'
        this.apiError = apiError
    }
}
