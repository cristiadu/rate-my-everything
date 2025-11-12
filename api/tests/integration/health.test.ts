import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'

describe('Health API Integration Test', async () => {
  const testApp = await appReady

  describe('Health API Integration Test', () => {
    it('should return health status with database connected', async () => {
      await request(testApp)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('healthy')
          expect(res.body.message).toBe('All systems operational')
          expect(res.body.services.database.status).toBe('healthy')
          expect(res.body.services.database.message).toBe('Database connection is healthy')
          expect(res.body.services.app.status).toBe('healthy')
          expect(res.body.services.app.message).toBe('Application is running smoothly')
          expect(res.body).toHaveProperty('timestamp')
        }
        )
    })
  })
})