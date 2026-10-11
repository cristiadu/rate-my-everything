import request from 'supertest'
import type { Express } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'
import UserRole from '@/models/UserRole'

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
/** Registers a fresh user with the given roles (only "user" by default) and returns its token. */
export const getUserRoleAuthToken = async (app: Express, roles: UserRole[] = [UserRole.USER]): Promise<string> => {
  const username = `${roles.join('-')}-${Date.now()}`
  const password = 'Password123!'
  await request(app)
    .post('/api/login/register')
    .send({ username, email: `${username}@example.com`, password, roles })
    .expect(201)

  const loginRes = await request(app)
    .post('/api/login')
    .send({ username, password })
    .expect(200)
  return loginRes.body.token
}
