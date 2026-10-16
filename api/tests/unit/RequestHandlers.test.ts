import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { errorHandler } from '@/helpers/RequestHandlers'

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
})
