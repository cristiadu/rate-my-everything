import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UserTokenResponse, type UserResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import { TEST_USER } from '@@/testutils/setup'
import { Endpoints } from '@@/testutils/common/constants'
import { registerAndLogin } from '@@/testutils/common/Auth'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  afterEach(() => {
    vi.unstubAllEnvs()
  })

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
    it('should reject an empty username', async () => {
      // GIVEN an empty username and the admin test user's password
      // WHEN logging in
      // THEN the credentials are reported missing
      await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: '', password: TEST_USER.password })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Username and password are required')
          expect(apiError.code).toBe(ErrorCode.MISSING_CREDENTIALS)
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail with an internal error when the server has no JWT secret to sign tokens', async () => {
      // GIVEN a server without JWT_SECRET
      vi.stubEnv('JWT_SECRET', '')

      // WHEN the admin test user logs in with valid credentials
      // THEN no token is issued and an internal error comes back
      await request(testApp)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: TEST_USER.email, password: TEST_USER.password })
        .expect('Content-Type', /json/)
        .expect(500)
        .expect(res => {
          expect(res.body).toEqual({ code: ErrorCode.INTERNAL_ERROR, status: 500, message: 'An internal server error occurred' })
        })
    })
  })

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}/register`, () => {
    it('should give a new account only the user role, even when other roles are sent', async () => {
      // GIVEN a sign-up that asks for the admin role
      // WHEN registering and then logging in
      const { registerRes, loginRes } = await registerAndLogin(testApp, 'signup', { roles: [UserRole.ADMIN] })

      // THEN the account and its token hold only the user role
      expect((registerRes.body as UserResponse).roles).toEqual([UserRole.USER])
      expect((loginRes.body as UserTokenResponse).user.roles).toEqual([UserRole.USER])
    })

    it('should let a new account use the endpoints for signed-in users', async () => {
      // GIVEN a freshly registered account
      const { loginRes } = await registerAndLogin(testApp, 'signup-access')

      // WHEN it lists its own ratings
      // THEN the request is allowed
      await request(testApp)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${(loginRes.body as UserTokenResponse).token}`)
        .expect(200)
    })

    it('should reject a sign-up with an empty email', async () => {
      // GIVEN a sign-up with a username and password but an empty email
      // WHEN registering
      // THEN the missing fields are reported
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/register`)
        .send({ username: `no-email-${Date.now()}`, email: '', password: TEST_USER.password })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should reject a sign-up with a username that is already taken', async () => {
      // GIVEN the admin test user's username
      // WHEN someone registers with it
      // THEN the username is reported as taken
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/register`)
        .send({ username: TEST_USER.email, email: 'impostor@example.com', password: TEST_USER.password })
        .expect('Content-Type', /json/)
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Username already exists')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS)
          expect(apiError.status).toBe(422)
        })
    })
  })
})
