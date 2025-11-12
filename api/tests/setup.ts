import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import path from 'path'
import request from 'supertest'
import { appReady, DBConnection, server } from '@/index'

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true
})

export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
}
export let authToken: string | null = null

import User from '@/models/User'
import UserRole from '@/models/UserRole'

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
        testUser.username = TEST_USER.name
        testUser.email = TEST_USER.email
        testUser.password = await bcrypt.hash(TEST_USER.password, 10)
        testUser.roles = [UserRole.ADMIN]
        
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Attempting to get auth token...')
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: TEST_USER.name,
          password: TEST_USER.password
        })
            
      if (loginResponse.status === 200) {
        authToken = loginResponse.body.token
        console.log('Authentication token obtained for tests')
      } else {
        console.error('Failed to get auth token')
        console.error('Response body:', loginResponse.body)
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
