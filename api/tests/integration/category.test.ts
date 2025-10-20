import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app, authToken } from '@@/testutils/setup'

describe('Category API Integration Tests', () => {
  it('should create a new category when authorized', async () => {
    const newCategory = {
      name: 'Test Category',
      description: 'Created during integration tests'
    }
    
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newCategory)
      .expect('Content-Type', /json/)
      .expect(201)
    
    expect(response.body).toHaveProperty('id')
    expect(response.body.name).toBe(newCategory.name)
    expect(response.body.description).toBe(newCategory.description)
  })
  
  it('should return all categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200)
    
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toHaveProperty('id')
    expect(response.body[0]).toHaveProperty('name')
    expect(response.body[0]).toHaveProperty('description')
  })
  
  it('should return a specific category by name', async () => {
    const categoriesResponse = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
  
    expect(categoriesResponse.body).toBeInstanceOf(Array)
    expect(categoriesResponse.body.length).toBeGreaterThan(0)
    const categoryName = categoriesResponse.body[0].name
    
    const response = await request(app)
      .get(`/api/categories/${categoryName}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200)
    
    expect(response.body).toHaveProperty('name', categoryName)
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('description')
  })
})