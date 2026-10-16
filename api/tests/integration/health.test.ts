import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { Health, HealthMessage, HealthStatus, ComponentHealth } from '@/models/Health'
import { DatabaseHealthIndicator } from '@/services/HealthIndicators'
import { Endpoints } from '@@/testutils/common/constants'

describe('Health API Integration Test', async () => {
  const testApp = await appReady

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe(`GET ${Endpoints.HEALTH_BASE_PATH}`, () => {
    it('should return health status with database connected', async () => {
      // GIVEN the running app with its database connected
      // WHEN its health is requested
      // THEN the app and the database report healthy
      await request(testApp)
        .get(Endpoints.HEALTH_BASE_PATH)
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

    it('should answer 500 and name the failing component when the database is down', async () => {
      // GIVEN the database health check reports its connection failed
      vi.spyOn(DatabaseHealthIndicator.prototype, 'checkHealth').mockResolvedValueOnce({
        database: new ComponentHealth(HealthStatus.UNHEALTHY, 'Database connection failed'),
      })

      // WHEN the health is requested
      // THEN the service reports unhealthy with a 500 status
      await request(testApp)
        .get(Endpoints.HEALTH_BASE_PATH)
        .expect('Content-Type', /json/)
        .expect(500)
        .expect(res => {
          const health = res.body as Health
          expect(health.status).toBe(HealthStatus.UNHEALTHY)
          expect(health.message).toBe(HealthMessage.SOME_SYSTEMS_ISSUES)
          expect(health.services?.database).toStrictEqual({ status: HealthStatus.UNHEALTHY, message: 'Database connection failed' })
        })
    })
  })
})
