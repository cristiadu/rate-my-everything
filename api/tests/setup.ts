import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import path from 'path'
import request from 'supertest'
import { appReady, DBConnection, server } from '@/index'
import User, { UserTokenResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import { writeAuthTokenToFile } from '@@/testutils/common/Auth'

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true
})

/** How many times setup checks whether the database connection is ready. */
const DB_INIT_MAX_RETRIES = 15

/** Wait between database readiness checks, in milliseconds. */
const DB_INIT_RETRY_DELAY_MS = 3000

/** Wait for routes to be registered after the database connects, in milliseconds. */
const ROUTE_REGISTRATION_DELAY_MS = 2000

/** bcrypt cost factor used to hash the test user's password. */
const PASSWORD_SALT_ROUNDS = 10

export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
}

/** Global test setup: waits for the database, then creates the admin test user and stores its token. */
const setup = async () => {
    const app = await appReady
    let retries = 0
    while (!DBConnection.isInitialized && retries < DB_INIT_MAX_RETRIES) {
      console.log(`Waiting for database connection to initialize... (Attempt ${retries + 1}/${DB_INIT_MAX_RETRIES})`)
      try {
        await new Promise(resolve => setTimeout(resolve, DB_INIT_RETRY_DELAY_MS))
        retries++
      } catch (err) {
        console.error('Error waiting for database initialization:', err)
      }
    }

    if (!DBConnection.isInitialized) {
      throw new Error('Database connection failed to initialize after multiple attempts')
    }
    
    try {
      console.log('Attempting to create test user...')
      const userRepo = DBConnection.getRepository(User)
      
      try {
        const testUser = new User()
        testUser.username = TEST_USER.email
        testUser.email = TEST_USER.email
        testUser.password = await bcrypt.hash(TEST_USER.password, PASSWORD_SALT_ROUNDS)
        testUser.roles = [UserRole.ADMIN, UserRole.USER]
        await userRepo.save(testUser)
        console.log('Test user created successfully')
      } catch (error) {
        console.log('User may already exist:', error instanceof Error ? error.message : 'Unknown error')
      }
    } catch (error) {
      console.error('Error setting up test user:', error)
      console.log('Continuing with tests despite user creation error')
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, ROUTE_REGISTRATION_DELAY_MS))
      
      console.log('Attempting to get auth token...')
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: TEST_USER.email,
          password: TEST_USER.password
        })
            
      const response = loginResponse.body as UserTokenResponse
      if (loginResponse.status === 200 && response && response.token) {
        writeAuthTokenToFile(response.token)
        console.log('Auth token obtained and written to file successfully')
      } else {
        console.error('Failed to get valid auth token')
        console.error('Response body:', JSON.stringify(loginResponse.body, null, 2))
        throw new Error('Could not obtain valid JWT for tests')
      }
    } catch (error) {
      console.error('Error getting auth token:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    return async () => {
      if (DBConnection.isInitialized) {
        await DBConnection.destroy()
        server.close()
        console.log('Database connection closed after tests')
      }
    }
}

export default setup
