import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { errorHandler } from '@/helpers/RequestHandlers'
import { InvalidAttributeValue } from '@/errors/InvalidAttributeValue'
import ErrorCode from '@/errors/ErrorCode'

describe('errorHandler', () => {
  it('hands the error to Express when the response was already started', () => {
    // GIVEN an error raised after the response headers were sent
    const error = new Error('Stream closed while writing the body')
    const response = { headersSent: true } as Response
    const next = vi.fn()

    // WHEN the error is handled
    errorHandler(error, {} as Request, response, next)

    // THEN Express's default handler receives it to close the connection
    expect(next).toHaveBeenCalledWith(error)
  })

  it('answers a value that does not fit its attribute with a validation error', () => {
    // GIVEN a value rejected by its attribute's value type
    const error = new InvalidAttributeValue('Invalid value "abc" for Price: expected an amount such as 12.50')
    const json = vi.fn()
    const response = { headersSent: false, status: vi.fn().mockReturnValue({ json }) } as Response

    // WHEN the error is handled
    errorHandler(error, {} as Request, response, vi.fn())

    // THEN the client gets a 400 validation error carrying the message
    expect(response.status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith({
      code: ErrorCode.VALIDATION_ERROR, status: 400, message: 'Invalid value "abc" for Price: expected an amount such as 12.50',
    })
  })
})
