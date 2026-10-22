import type APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'

/*
 * Responses that the controllers share. tsoa reads these constants and types where @Response decorators use them,
 * so each error response and its headers are described once, with one example, and documented the same way on every
 * operation that returns them. Ids in paths and bodies share the ResourceId type from models/ResourceId.ts.
 */

/**
 * Headers the rate limiter sends with every response, as whole numbers; a 429 also says how long to wait. Decorators pass it as
 * `{ [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }` because tsoa lists each header of an inline
 * object type, while a named interface would be documented as one header called RateLimitHeaders.
 */
export interface RateLimitHeaders {
  /**
   * Requests one client may make in each 15 minute window.
   * @pattern ^[0-9]+$
   * @example "1000"
   */
  'X-RateLimit-Limit': string
  /**
   * Requests left in the current window.
   * @pattern ^[0-9]+$
   * @example "0"
   */
  'X-RateLimit-Remaining': string
  /**
   * When the current window ends, in seconds since the Unix epoch.
   * @pattern ^[0-9]+$
   * @example "1760533200"
   */
  'X-RateLimit-Reset': string
  /**
   * Seconds to wait before sending another request.
   * @pattern ^[0-9]+$
   * @example "540"
   */
  'Retry-After': string
}

export const BAD_REQUEST_DESCRIPTION = 'The path, query or body is invalid; the message names each invalid field'
export const BAD_REQUEST_EXAMPLE: APIError = {
  code: ErrorCode.VALIDATION_ERROR,
  status: 400,
  message: "Invalid request: input.name: 'name' is required",
}

export const UNAUTHORIZED_DESCRIPTION = 'The bearer token is missing or invalid'
export const UNAUTHORIZED_EXAMPLE: APIError = {
  code: ErrorCode.UNAUTHORIZED,
  status: 401,
  message: 'Missing or invalid authorization header',
}

export const INVALID_CREDENTIALS_DESCRIPTION = 'The username or password is wrong'
export const INVALID_CREDENTIALS_EXAMPLE: APIError = {
  code: ErrorCode.INVALID_CREDENTIALS,
  status: 401,
  message: 'Invalid username or password',
}

export const INVALID_RESET_TOKEN_DESCRIPTION = 'The body is invalid, or the reset token is unknown, already used or expired'
export const INVALID_RESET_TOKEN_EXAMPLE: APIError = {
  code: ErrorCode.VALIDATION_ERROR,
  status: 400,
  message: 'This reset link is invalid or has expired',
}

export const FORBIDDEN_DESCRIPTION = 'The signed-in user may not call this operation or change this resource'
export const FORBIDDEN_EXAMPLE: APIError = {
  code: ErrorCode.FORBIDDEN,
  status: 403,
  message: 'You do not have permission to access this resource',
}

export const NOT_FOUND_DESCRIPTION = 'The resource does not exist'
export const NOT_FOUND_EXAMPLE: APIError = {
  code: ErrorCode.RESOURCE_NOT_FOUND,
  status: 404,
  message: 'Item not found',
}

export const UNPROCESSABLE_DESCRIPTION = 'The request refers to a resource that does not exist or clashes with an existing one'
export const UNPROCESSABLE_EXAMPLE: APIError = {
  code: ErrorCode.VALIDATION_ERROR,
  status: 422,
  message: 'Unknown category id: 9',
}

export const TOO_MANY_REQUESTS_DESCRIPTION = 'The client sent too many requests in the current rate limit window'
export const TOO_MANY_REQUESTS_EXAMPLE: APIError = {
  code: ErrorCode.TOO_MANY_REQUESTS,
  status: 429,
  message: 'Too many requests, try again later',
}

export const INTERNAL_ERROR_DESCRIPTION = 'Something unexpected failed'
export const INTERNAL_ERROR_EXAMPLE: APIError = {
  code: ErrorCode.INTERNAL_ERROR,
  status: 500,
  message: 'An internal server error occurred',
}

export const EXTERNAL_SERVICE_ERROR_DESCRIPTION = 'The external source failed to answer'
export const EXTERNAL_SERVICE_ERROR_EXAMPLE: APIError = {
  code: ErrorCode.EXTERNAL_SERVICE_ERROR,
  status: 502,
  message: 'lastfm answered the import request with status 500',
}

export const SERVICE_UNAVAILABLE_DESCRIPTION = 'The external source has no API key configured on this server'
export const SERVICE_UNAVAILABLE_EXAMPLE: APIError = {
  code: ErrorCode.SERVICE_UNAVAILABLE,
  status: 503,
  message: 'Importing from lastfm is not configured on this server',
}
