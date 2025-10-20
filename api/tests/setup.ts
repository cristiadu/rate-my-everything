import 'reflect-metadata'
import * as dotenv from 'dotenv'
import path from 'path'
import '@testing-library/jest-dom'
import { beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'

dotenv.config({
  path: path.resolve(__dirname, '../.env.test')
})

import User from '@/models/User'
import UserRole from '@/models/UserRole'
import { app, DBConnection } from '@/index'

export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
}

export { app }
export let authToken: string | null = null

beforeAll(async () => {
    if (!DBConnection.isInitialized) {
      console.log('Waiting for database connection to initialize...')
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (err) {
        console.error('Error waiting for database initialization:', err)
      }
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
})
