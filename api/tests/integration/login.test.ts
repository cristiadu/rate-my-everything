import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UserTokenResponse } from '@/models/User'
import { TEST_USER } from '@@/testutils/setup'
import { Endpoints } from '@@/testutils/common/constants'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}`, () => {
    it('should return a token when credentials are valid', async () => {
      await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
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
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email,
          password: 'wrong-password'
        })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Invalid username or password')
          expect(apiError.code).toBe(ErrorCode.INVALID_CREDENTIALS)
          expect(apiError.status).toBe(401)
        })
    })

    it('should reject missing credentials', async () => {
      await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email
          // Missing password
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Username and password are required')
          expect(apiError.code).toBe(ErrorCode.MISSING_CREDENTIALS)
          expect(apiError.status).toBe(400)
        })
    })
  })
})