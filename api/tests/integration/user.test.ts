import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import User from '@/models/User'
import UserRole from '@/models/UserRole'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'

/** Password every test user starts with. */
const INITIAL_PASSWORD = 'Password123!'

/** Builds a unique user payload so reruns never collide. */
const buildUserPayload = (prefix: string) => ({
  username: `${prefix}-${Date.now()}`,
  email: `${prefix}-${Date.now()}@example.com`,
  password: INITIAL_PASSWORD,
  roles: [UserRole.USER],
})

describe('User API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  const existingUserPayload = buildUserPayload('existing-user')
  let existingUser: User
  const createdUserIds: number[] = []

  beforeAll(async () => {
    const res = await request(app)
      .post(Endpoints.USERS_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send(existingUserPayload)
      .expect(201)
    existingUser = res.body as User
    createdUserIds.push(existingUser.id)
  })

  afterAll(async () => {
    for (const id of createdUserIds) {
      await request(app)
        .delete(`${Endpoints.USERS_BASE_PATH}/${id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
    }
  })

  describe(`POST ${Endpoints.USERS_BASE_PATH}`, () => {
    it('should create a user without returning the password', async () => {
      // GIVEN a new user payload
      const payload = buildUserPayload('new-user')

      // WHEN it is posted
      const res = await request(app)
        .post(Endpoints.USERS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(201)

      // THEN the created user comes back without a password
      const apiResult = res.body as User
      createdUserIds.push(apiResult.id)
      expect(apiResult.id).toBeDefined()
      expect(apiResult.username).toBe(payload.username)
      expect(apiResult.roles).toEqual(['user'])
      expect(apiResult.password).toBeUndefined()
    })
  })

  describe(`GET ${Endpoints.USERS_BASE_PATH}`, () => {
    it('should list users without passwords', async () => {
      // GIVEN an existing user (created in beforeAll)
      // WHEN the user list is requested
      const res = await request(app)
        .get(Endpoints.USERS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)

      // THEN it includes the user and no password fields
      const users = res.body as User[]
      expect(users.map(user => user.id)).toContain(existingUser.id)
      expect(users.filter(user => user.password !== undefined)).toEqual([])
    })

    it('should get a user by id', async () => {
      // GIVEN an existing user (created in beforeAll)
      // WHEN it is requested by id
      const res = await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/${existingUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)

      // THEN that user comes back without a password
      const apiResult = res.body as User
      expect(apiResult.id).toBe(existingUser.id)
      expect(apiResult.username).toBe(existingUserPayload.username)
      expect(apiResult.password).toBeUndefined()
    })

    it('should return 404 for an unknown user id', async () => {
      // GIVEN an id no user has
      // WHEN it is requested
      const res = await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)

      // THEN a not-found error comes back
      const apiError = res.body as APIError
      expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(apiError.message).toBe('User not found')
    })
  })

  describe(`PUT ${Endpoints.USERS_BASE_PATH}/:id`, () => {
    it('should update roles and keep the existing password when none is sent', async () => {
      // GIVEN an existing user (created in beforeAll)
      // WHEN only its roles are updated
      const res = await request(app)
        .put(`${Endpoints.USERS_BASE_PATH}/${existingUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ roles: [UserRole.USER, UserRole.MODERATOR] })
        .expect('Content-Type', /json/)
        .expect(200)

      // THEN the roles change and the old password still logs in
      const apiResult = res.body as User
      expect(apiResult.roles).toEqual(['user', 'moderator'])
      expect(apiResult.password).toBeUndefined()
      await request(app)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: existingUserPayload.username, password: INITIAL_PASSWORD })
        .expect(200)
    })

    it('should hash a new password so the user can log in with it', async () => {
      // GIVEN an existing user (created in beforeAll)
      // WHEN its password is changed
      await request(app)
        .put(`${Endpoints.USERS_BASE_PATH}/${existingUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: 'NewPassword456!' })
        .expect(200)

      // THEN the new password logs in
      await request(app)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: existingUserPayload.username, password: 'NewPassword456!' })
        .expect(200)
    })
  })

  describe(`DELETE ${Endpoints.USERS_BASE_PATH}/:id`, () => {
    it('should delete the user', async () => {
      // GIVEN an existing user (created in beforeAll)
      // WHEN it is deleted
      await request(app)
        .delete(`${Endpoints.USERS_BASE_PATH}/${existingUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it can no longer be found
      await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/${existingUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })
  })
})
