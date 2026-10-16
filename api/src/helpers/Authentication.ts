import { Request } from 'express'
import jwt from 'jsonwebtoken'
import UserRole from '@/models/UserRole'
import { SessionUser } from '@/models/User'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { logger } from '@/helpers/Logger'

/** Name of the security scheme controllers put in `@Security`; it is the bearer token the login endpoint returns. */
export const BEARER_AUTH = 'bearerAuth'

/** A request that passed `@Security`, with the user its bearer token belongs to. */
export type AuthenticatedRequest = Request & { user: SessionUser }

/** Reads the user from a bearer token, rejecting the request with 401 when it is missing, invalid or holds bad claims. */
const verifyBearerToken = (authorization: string | undefined): SessionUser => {
  const token = authorization?.startsWith('Bearer ') ? authorization.split(' ')[1] : null
  if (!token) {
    throw new RequestRejected(NewApiError(ErrorCode.UNAUTHORIZED, 401, 'Missing or invalid authorization header'))
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    logger.error('JWT_SECRET environment variable is not defined')
    throw new RequestRejected(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'Internal server error'))
  }

  let decodedUser: SessionUser
  try {
    decodedUser = jwt.verify(token, jwtSecret) as SessionUser
  } catch (err) {
    logger.info(err, 'JWT verification error')
    throw new RequestRejected(NewApiError(ErrorCode.UNAUTHORIZED, 401, 'Invalid token'))
  }

  if (typeof decodedUser !== 'object' || decodedUser === null || !('id' in decodedUser) || !('roles' in decodedUser)) {
    throw new RequestRejected(NewApiError(ErrorCode.UNAUTHORIZED, 401, 'Invalid user object in JWT payload'))
  }
  if (!Array.isArray(decodedUser.roles) || !decodedUser.roles.every((role) => Object.values(UserRole).includes(role))) {
    throw new RequestRejected(NewApiError(ErrorCode.UNAUTHORIZED, 401, 'Invalid roles in user object'))
  }
  return decodedUser
}

/**
 * Checks the `@Security` of an operation: the bearer token must be valid (401) and its user must hold one of the
 * roles listed as scopes (403). tsoa puts the returned user in `request.user`.
 */
export const expressAuthentication = async (request: Request, securityName: string, roles: string[] = []): Promise<SessionUser> => {
  if (securityName !== BEARER_AUTH) {
    throw new RequestRejected(NewApiError(ErrorCode.UNAUTHORIZED, 401, `Unknown security scheme: ${securityName}`))
  }

  const sessionUser = verifyBearerToken(request.headers.authorization)
  if (roles.length > 0 && !sessionUser.roles.some((role) => roles.includes(role))) {
    throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, 'You do not have permission to access this resource'))
  }
  return sessionUser
}
