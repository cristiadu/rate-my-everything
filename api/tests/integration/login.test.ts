import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { TEST_USER } from '@@/testutils/setup'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import { UserTokenResponse } from '@/models/User'

const LOGIN_BASE_PATH = '/api/login'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  describe(`POST ${LOGIN_BASE_PATH}`, () => {
    it('should return a token when credentials are valid', async () => {
      await request(testApp)
        .post(LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email,
          password: TEST_USER.password
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const loginResponse = res.body as UserTokenResponse
          expect(loginResponse.token).toBeDefined()
          expect(loginResponse.user).toBeDefined()
          expect(loginResponse.user.id).toBeDefined()
          expect(loginResponse.user.roles).toContain('admin')
          expect(loginResponse.user.username).toBe(TEST_USER.email)
        })
    })

    it('should reject invalid credentials', async () => {
      await request(testApp)
        .post(LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email,
          password: 'wrong-password'
        })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Invalid username or password')
          expect(apiError.code).toBe('INVALID_CREDENTIALS')
          expect(apiError.status).toBe(401)
        })
    })

    it('should reject missing credentials', async () => {
      await request(testApp)
        .post(LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email
          // Missing password
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Username and password are required')
          expect(apiError.code).toBe('MISSING_CREDENTIALS')
          expect(apiError.status).toBe(400)
        })
    })
  })
})