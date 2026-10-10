import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import User from '@/models/User'
import UserRole from '@/models/UserRole'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'

describe('User API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  const newUser = {
    username: `test-user-${Date.now()}`,
    email: `test-user-${Date.now()}@example.com`,
    password: 'Password123!',
    roles: [UserRole.USER],
  }
  let createdUser: User

  describe(`POST ${Endpoints.USERS_BASE_PATH}`, () => {
    it('should create a user without returning the password', async () => {
      await request(app)
        .post(Endpoints.USERS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as User
          expect(apiResult.id).toBeDefined()
          expect(apiResult.username).toBe(newUser.username)
          expect(apiResult.roles).toEqual([UserRole.USER])
          expect(apiResult.password).toBeUndefined()
          createdUser = apiResult
        })
    })
  })

  describe(`GET ${Endpoints.USERS_BASE_PATH}`, () => {
    it('should list users without passwords', async () => {
      await request(app)
        .get(Endpoints.USERS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const users = res.body as User[]
          expect(users.some(user => user.id === createdUser.id)).toBe(true)
          users.forEach(user => expect(user.password).toBeUndefined())
        })
    })

    it('should get a user by id', async () => {
      await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/${createdUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as User
          expect(apiResult.id).toBe(createdUser.id)
          expect(apiResult.password).toBeUndefined()
        })
    })

    it('should return 404 for an unknown user id', async () => {
      await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
        })
    })
  })

  describe(`PUT ${Endpoints.USERS_BASE_PATH}/:id`, () => {
    it('should update roles and keep the existing password when none is sent', async () => {
      await request(app)
        .put(`${Endpoints.USERS_BASE_PATH}/${createdUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ roles: [UserRole.USER, UserRole.MODERATOR] })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as User
          expect(apiResult.roles).toEqual([UserRole.USER, UserRole.MODERATOR])
          expect(apiResult.password).toBeUndefined()
        })

      await request(app)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: newUser.username, password: newUser.password })
        .expect(200)
    })

    it('should hash a new password so the user can log in with it', async () => {
      const newPassword = 'NewPassword456!'
      await request(app)
        .put(`${Endpoints.USERS_BASE_PATH}/${createdUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ password: newPassword })
        .expect(200)

      await request(app)
        .post(Endpoints.LOGIN_BASE_PATH)
        .send({ username: newUser.username, password: newPassword })
        .expect(200)
    })
  })

  describe(`DELETE ${Endpoints.USERS_BASE_PATH}/:id`, () => {
    it('should delete the user', async () => {
      await request(app)
        .delete(`${Endpoints.USERS_BASE_PATH}/${createdUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      await request(app)
        .get(`${Endpoints.USERS_BASE_PATH}/${createdUser.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })
  })
})
