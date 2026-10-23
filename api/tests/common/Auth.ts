import request from 'supertest'
import type { Response } from 'supertest'
import type { Express } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { vi } from 'vitest'
import UserRole from '@/models/UserRole'
import { mailService } from '@/services/MailService'

const TMP_TOKEN_PATH = path.resolve(__dirname, '../../tmp/auth-token.txt')

// Helper to write token to ./tmp/auth-token.txt
export const writeAuthTokenToFile = (token: string) => {
  const tmpDir = path.resolve(__dirname, '../../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
  fs.writeFileSync(TMP_TOKEN_PATH, token + os.EOL)
  console.log('Authentication token written to file:', TMP_TOKEN_PATH)
}

// Helper to read token from ./tmp/auth-token.txt
export const getAuthTokenFromFile = (): Promise<string> => {
  return new Promise((resolve) => {
    fs.readFile(TMP_TOKEN_PATH, 'utf-8', (_err, data) => {
      resolve(data.trim())
    })
  })
}
/** Password given to every user the tests create. */
const TEST_PASSWORD = 'Password123!'

/** Signs up a fresh account through the public register endpoint, optionally asking for roles, and logs it in. */
export const registerAndLogin = async (
  app: Express, usernamePrefix: string, extraFields: { roles?: UserRole[] } = {},
): Promise<{ registerRes: Response, loginRes: Response }> => {
  const username = `${usernamePrefix}-${Date.now()}`
  const registerRes = await request(app)
    .post('/api/login/register')
    .send({ username, email: `${username}@example.com`, password: TEST_PASSWORD, ...extraFields })
    .expect(201)
  const loginRes = await request(app)
    .post('/api/login')
    .send({ username, password: TEST_PASSWORD })
    .expect(200)
  return { registerRes, loginRes }
}

/** Has the admin create a fresh user with the given roles (only "user" by default) and returns its token. */
export const getUserRoleAuthToken = async (app: Express, roles: UserRole[] = [UserRole.USER]): Promise<string> => {
  const username = `plain-${roles.join('-')}-${Date.now()}`
  const password = TEST_PASSWORD
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${await getAuthTokenFromFile()}`)
    .send({ username, email: `${username}@example.com`, password, roles })
    .expect(201)

  const loginRes = await request(app)
    .post('/api/login')
    .send({ username, password })
    .expect(200)
  return loginRes.body.token
}

/** Asks for a password reset email for the address, from the given client address, and returns the token it would carry. */
export const requestPasswordResetToken = async (app: Express, email: string, clientAddress: string): Promise<string> => {
  const sendPasswordReset = vi.spyOn(mailService, 'sendPasswordReset').mockResolvedValue()
  await request(app)
    .post('/api/login/password-reset')
    .set('X-Forwarded-For', clientAddress)
    .send({ email })
    .expect(204)
  const [, , token] = sendPasswordReset.mock.calls[0]
  sendPasswordReset.mockRestore()
  return token
}
