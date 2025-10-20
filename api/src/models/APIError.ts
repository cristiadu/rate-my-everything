export default class APIError {
    code: string
    status: number
    message: string

    constructor(code: APIErrorCodes, status: HttpStatusCode, message: string) {
        this.code = code
        this.status = status
        this.message = message
    }
}

export const NewApiError = (code: APIErrorCodes, status: HttpStatusCode, message: string): APIError => {
    return new APIError(code, status, message)
}

export const API_ERROR_CODES = {
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    CONFLICT: "CONFLICT",
    TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS"
}
export type APIErrorCodes = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

export type HttpStatusCode =
    200 | 201 | 202 | 204 | // Success
    400 | 401 | 403 | 404 | 429 | // Client Errors
    500; // Server Errors