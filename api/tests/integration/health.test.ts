import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { Health, HealthStatus, ComponentHealth } from '@/models/Health'

const HEALTH_BASE_PATH = '/api/health'

describe('Health API Integration Test', async () => {
  const testApp = await appReady

  describe('Health API Integration Test', () => {
    it('should return health status with database connected', async () => {
      await request(testApp)
        .get(HEALTH_BASE_PATH)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const health = res.body as Health
          expect(health.status).toBe(HealthStatus.HEALTHY)
          expect(health.timestamp).toBeDefined()
          expect(health.uptime).toBeGreaterThanOrEqual(0)
          expect(health.services).toBeDefined()
          expect(health.services).toStrictEqual({
            database: {
              status: HealthStatus.HEALTHY,
              message: 'Database connection is healthy'
            } as ComponentHealth,
            app: {
              status: HealthStatus.HEALTHY,
              message: 'Application is running smoothly'
            } as ComponentHealth
          })
        })
    })
  })
})