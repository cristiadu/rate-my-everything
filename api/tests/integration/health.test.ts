import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '@@/testutils/setup'

describe('Health API Integration Test', () => {
  it('should return health status with database connected', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200)
    
    expect(response.body.status).toBe('healthy')
    expect(response.body.message).toBe('All systems operational')
    expect(response.body.services.database.status).toBe('healthy')
    expect(response.body.services.database.message).toBe('Database connection is healthy')
    expect(response.body.services.app.status).toBe('healthy')
    expect(response.body.services.app.message).toBe('Application is running smoothly')
    expect(response.body).toHaveProperty('timestamp')
  })
})