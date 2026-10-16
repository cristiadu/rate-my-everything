import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UserTokenResponse } from '@/models/User'
import type { UserResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import { TEST_USER } from '@@/testutils/setup'
import { Endpoints } from '@@/testutils/common/constants'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}`, () => {
    it('should return a token when credentials are valid', async () => {
      // GIVEN the admin test user's email and password
      // WHEN logging in
      // THEN a token and the admin user come back
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
      // GIVEN the admin test user's email with a wrong password
      // WHEN logging in
      // THEN the login is rejected
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
      // GIVEN the admin test user's email and no password
      // WHEN logging in
      // THEN the login fails validation
      await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({
          username: TEST_USER.email
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe("Invalid request: credentials.password: 'password' is required")
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}/register`, () => {
    it('should give a new account only the user role, even when other roles are sent', async () => {
      // GIVEN a sign-up that asks for the admin role
      const username = `signup-${Date.now()}`
      const password = 'Password123!'

      // WHEN registering and then logging in
      const registerRes = await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/register`)
        .send({ username, email: `${username}@example.com`, password, roles: [UserRole.ADMIN] })
        .expect(201)
      const loginRes = await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username, password })
        .expect(200)

      // THEN the account and its token hold only the user role
      expect((registerRes.body as UserResponse).roles).toEqual([UserRole.USER])
      expect((loginRes.body as UserTokenResponse).user.roles).toEqual([UserRole.USER])
    })

    it('should let a new account use the endpoints for signed-in users', async () => {
      // GIVEN a freshly registered account
      const username = `signup-access-${Date.now()}`
      const password = 'Password123!'
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/register`)
        .send({ username, email: `${username}@example.com`, password })
        .expect(201)
      const loginRes = await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username, password })
        .expect(200)

      // WHEN it lists its own ratings
      // THEN the request is allowed
      await request(testApp)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${(loginRes.body as UserTokenResponse).token}`)
        .expect(200)
    })
  })
})
