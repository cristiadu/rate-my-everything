import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import APIError from '@/models/APIError'

describe('404 Generic Error Integration Tests', async () => {
  const app = await appReady

  it('should return 404 for unknown endpoint', async () => {
    await request(app)
      .get('/api/unknown-endpoint')
      .set('Authorization', `Bearer ${await getAuthTokenFromFile()}`)
      .expect('Content-Type', /json/)
      .expect(res => {
        const apiError = res.body as APIError
        expect(apiError.message).toBe('The requested resource was not found')
        expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
        expect(apiError.status).toBe(404)
      })
  })
})
