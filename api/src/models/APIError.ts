import ErrorCode from "@/errors/ErrorCode"

export default class APIError {
    code: ErrorCode
    status: HttpStatusCode
    message: string

    constructor(code: ErrorCode, status: HttpStatusCode, message: string) {
        this.code = code
        this.status = status
        this.message = message
    }
}

export const NewApiError = (code: ErrorCode, status: HttpStatusCode, message: string): APIError => {
    return new APIError(code, status, message)
}

export type HttpStatusCode =
    200 | 201 | 202 | 204 | // Success
    400 | 401 | 403 | 404 | 422 | 429 | // Client Errors
    500; // Server Errors
