import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UserTokenResponse, type UserResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import { TEST_USER } from '@@/testutils/setup'
import { Endpoints } from '@@/testutils/common/constants'
import { registerAndLogin, requestPasswordResetToken } from '@@/testutils/common/Auth'
import { DBConnection } from '@/Database'
import PasswordReset from '@/models/PasswordReset'
import { mailService } from '@/services/MailService'

describe('Login API Integration Tests', async () => {
  const testApp = await appReady

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
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

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}/password-reset`, () => {
    it('should email a reset link to the account using the address, whatever its case', async () => {
      // GIVEN a freshly registered account
      const { registerRes } = await registerAndLogin(testApp, 'reset-mail')
      const { username, email } = registerRes.body as UserResponse
      const sendPasswordReset = vi.spyOn(mailService, 'sendPasswordReset').mockResolvedValue()

      // WHEN a reset is asked for with its email in capitals
      // THEN the request is accepted and the account gets an email with a token valid for 60 minutes
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset`)
        .set('X-Forwarded-For', '198.51.100.10')
        .send({ email: email.toUpperCase() })
        .expect(204)
      expect(sendPasswordReset).toHaveBeenCalledTimes(1)
      expect(sendPasswordReset).toHaveBeenCalledWith(email, username, expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), 60)
    })

    it('should answer the same for an address no account uses, without sending an email', async () => {
      // GIVEN an address no account uses
      const sendPasswordReset = vi.spyOn(mailService, 'sendPasswordReset').mockResolvedValue()

      // WHEN a reset is asked for with it
      // THEN the request is accepted and no email is sent
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset`)
        .set('X-Forwarded-For', '198.51.100.11')
        .send({ email: 'nobody-here@example.com' })
        .expect(204)
        .expect(res => expect(res.text).toBe(''))
      expect(sendPasswordReset).not.toHaveBeenCalled()
    })

    it('should reject an empty email', async () => {
      // GIVEN an empty email
      // WHEN a reset is asked for with it
      // THEN the email is reported missing
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset`)
        .set('X-Forwarded-For', '198.51.100.12')
        .send({ email: '' })
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ code: ErrorCode.VALIDATION_ERROR, status: 400, message: 'Email is required' })
        })
    })
  })

  describe(`POST ${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`, () => {
    it('should set the new password once, and stop accepting the old one', async () => {
      // GIVEN an account with a reset token
      const { registerRes } = await registerAndLogin(testApp, 'reset-confirm')
      const { username, email } = registerRes.body as UserResponse
      const token = await requestPasswordResetToken(testApp, email, '198.51.100.20')

      // WHEN the new password is set with the token
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`)
        .send({ token, password: 'new-Password456!' })
        .expect(204)

      // THEN the new password logs in, the old one does not, and the token no longer works
      await request(testApp).post(Endpoints.LOGIN_BASE_PATH).send({ username, password: 'new-Password456!' }).expect(200)
      await request(testApp).post(Endpoints.LOGIN_BASE_PATH).send({ username, password: 'Password123!' }).expect(401)
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`)
        .send({ token, password: 'another-Password789!' })
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ code: ErrorCode.VALIDATION_ERROR, status: 400, message: 'This reset link is invalid or has expired' })
        })
    })

    it('should reject a token that has expired', async () => {
      // GIVEN an account whose reset token expired
      const { registerRes } = await registerAndLogin(testApp, 'reset-expired')
      const { id, email } = registerRes.body as UserResponse
      const token = await requestPasswordResetToken(testApp, email, '198.51.100.21')
      await DBConnection.getRepository(PasswordReset).update({ user: { id } }, { expiresAt: new Date(Date.now() - 1000) })

      // WHEN the new password is set with it
      // THEN the token is rejected
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`)
        .send({ token, password: 'new-Password456!' })
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ code: ErrorCode.VALIDATION_ERROR, status: 400, message: 'This reset link is invalid or has expired' })
        })
    })

    it('should reject the earlier token once a newer one is sent', async () => {
      // GIVEN an account that asked for two reset links
      const { registerRes } = await registerAndLogin(testApp, 'reset-replaced')
      const { email } = registerRes.body as UserResponse
      const firstToken = await requestPasswordResetToken(testApp, email, '198.51.100.22')
      await requestPasswordResetToken(testApp, email, '198.51.100.22')

      // WHEN the new password is set with the first token
      // THEN the token is rejected
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`)
        .send({ token: firstToken, password: 'new-Password456!' })
        .expect(400)
    })

    it('should reject an empty token', async () => {
      // GIVEN an empty token
      // WHEN a new password is set with it
      // THEN the token is reported missing
      await request(testApp)
        .post(`${Endpoints.LOGIN_BASE_PATH}/password-reset/confirm`)
        .send({ token: '', password: 'new-Password456!' })
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ code: ErrorCode.VALIDATION_ERROR, status: 400, message: 'Token and password are required' })
        })
    })
  })
})
