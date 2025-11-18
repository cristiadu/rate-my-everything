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

export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
}

// Export the setup function for global setup
export default async function setup() {
    const app = await appReady
    const maxRetries = 15
    let retries = 0
    while (!DBConnection.isInitialized && retries < maxRetries) {
      console.log(`Waiting for database connection to initialize... (Attempt ${retries + 1}/${maxRetries})`)
      try {
        await new Promise(resolve => setTimeout(resolve, 3000))
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
        testUser.password = await bcrypt.hash(TEST_USER.password, 10)
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
      // Wait a bit for routes to be registered after DB connection
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log('Attempting to get auth token...')
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: TEST_USER.email,
          password: TEST_USER.password
        })
            
      const response = loginResponse.body as UserTokenResponse
      console.log('Login response body:', JSON.stringify(loginResponse.body, null, 2))
      if (loginResponse.status === 200 && response && response.token) {
        writeAuthTokenToFile(response.token)
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
