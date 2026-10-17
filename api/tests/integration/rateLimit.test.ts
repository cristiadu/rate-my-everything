import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { TOO_MANY_REQUESTS_EXAMPLE } from '@/api/ApiDocumentation'

/** Requests one client may make per window, as configured in index.ts. */
const RATE_LIMIT_MAX_REQUESTS = 1000

describe('Rate Limit Integration Tests', async () => {
  const app = await appReady

  it('should answer with an API error once the client sent too many requests', async () => {
    // GIVEN a client that used up its requests for the current window
    for (let sent = 0; sent < RATE_LIMIT_MAX_REQUESTS; sent += 1) {
      await request(app).get('/api/unknown-endpoint').expect(404)
    }

    // WHEN it sends one more request
    // THEN a too-many-requests API error comes back with the rate limit headers the spec documents
    await request(app)
      .get('/api/unknown-endpoint')
      .expect('Content-Type', /json/)
      .expect(429)
      .expect(res => {
        const apiError = res.body as APIError
        expect(apiError).toStrictEqual(TOO_MANY_REQUESTS_EXAMPLE)
        expect(apiError.code).toBe(ErrorCode.TOO_MANY_REQUESTS)
        expect(res.headers['x-ratelimit-limit']).toBe(String(RATE_LIMIT_MAX_REQUESTS))
        expect(res.headers['x-ratelimit-remaining']).toBe('0')
        expect(res.headers['x-ratelimit-reset']).toMatch(/^[0-9]+$/)
        expect(res.headers['retry-after']).toMatch(/^[0-9]+$/)
      })
  })

  it('should count each client behind the proxy separately', async () => {
    // GIVEN a client behind the proxy that used up its requests for the current window
    for (let sent = 0; sent < RATE_LIMIT_MAX_REQUESTS; sent += 1) {
      await request(app).get('/api/unknown-endpoint').set('X-Forwarded-For', '198.51.100.1').expect(404)
    }

    // WHEN another client behind the same proxy sends a request
    // THEN it is answered with its own full budget
    await request(app)
      .get('/api/unknown-endpoint')
      .set('X-Forwarded-For', '198.51.100.2')
      .expect(404)
      .expect(res => {
        expect(res.headers['x-ratelimit-remaining']).toBe('999')
      })
  })
})
