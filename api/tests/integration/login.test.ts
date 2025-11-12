import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { TEST_USER } from '@@/testutils/setup'
import { appReady } from '@/index'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  describe('Login API Integration Tests', () => {
    it('should return a token when credentials are valid', async () => {
      await request(testApp)
        .post('/api/login')
        .send({
          username: TEST_USER.name,
          password: TEST_USER.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('token')
          expect(res.body).toHaveProperty('user')
          expect(res.body.user.email).toBe(TEST_USER.email)
          expect(res.body.user.name).toBe(TEST_USER.name)
        })
    })

    it('should reject invalid credentials', async () => {
      await request(testApp)
        .post('/api/login')
        .send({
          username: TEST_USER.name,
          password: 'wrong-password'
        })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          expect(res.body).toHaveProperty('error')
          expect(res.body.error).toBe('Invalid username or password')
        })
    })

    it('should reject missing credentials', async () => {
      await request(testApp)
        .post('/api/login')
        .send({
          username: TEST_USER.name
          // Missing password
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          expect(res.body).toHaveProperty('error')
          expect(res.body.error).toBe('Username and password are required')
        })
    })
  })
})