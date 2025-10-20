import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app, TEST_USER } from '../setup'

describe('Login API Integration Tests', () => {
  it('should return a token when credentials are valid', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: TEST_USER.name,
        password: TEST_USER.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
    
    expect(response.body).toHaveProperty('token')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user.email).toBe(TEST_USER.email)
    expect(response.body.user.name).toBe(TEST_USER.name)
  })
  
  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/login')
      .send({
        username: TEST_USER.name,
        password: 'wrong-password'
      })
      .expect(401)
  })
  
  it('should reject missing credentials', async () => {
    await request(app)
      .post('/api/login')
      .send({
        username: TEST_USER.name
        // Missing password
      })
      .expect(400)
  })
})