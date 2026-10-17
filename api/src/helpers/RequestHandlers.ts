import { NextFunction, Request, Response } from 'express'
import { ValidateError } from 'tsoa'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { InvalidAttributeValue } from '@/errors/InvalidAttributeValue'
import { logger } from '@/helpers/Logger'

/** Marks every response as JSON. */
export const addDefaultHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json')
  return next()
}

/** Describes the fields tsoa rejected, such as `requestBody.name: 'name' is required`. */
export const describeValidationError = (error: ValidateError): string => Object.entries(error.fields)
  .map(([field, { message }]) => `${field}: ${message}`)
  .join('; ')

/** Answers an /api path no controller serves with a not-found API error. */
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json(NewApiError(ErrorCode.NOT_FOUND, 404, 'Could not find an API resource at the specified path'))
}

/**
 * Turns errors thrown by controllers and tsoa into API errors: 400 for request values that do not match the spec or
 * their attribute's value type, the carried status for rejected requests, and 500 for anything else.
 */
export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error)
  }
  if (error instanceof ValidateError) {
    return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, `Invalid request: ${describeValidationError(error)}`))
  }
  if (error instanceof InvalidAttributeValue) {
    return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, error.message))
  }
  if (error instanceof RequestRejected) {
    return res.status(error.apiError.status).json(error.apiError)
  }

  logger.error(error)
  return res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
}
