import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { authToken } from '@@/testutils/setup'

describe('Category API Integration Tests', async () => {
  const app = await appReady

  beforeAll(async () => {
   // Delete all categories beforehand so env is clean for test run.
   const categoriesResponse = await request(app)
     .get('/api/categories')
     .set('Authorization', `Bearer ${authToken}`)
     .expect(200)
    console.log('Categories to delete:', categoriesResponse.body)

    const categories = categoriesResponse.body
    for (const category of categories) {
      await request(app)
        .delete(`/api/categories/${category.name}`)
        .set('Authorization', `Bearer ${authToken}`)
      console.log(`Deleted category: ${category.name}`)
    }
  })

  it('should create a new category when authorized', async () => {
    const newCategory = {
      name: `Test-Category-${Date.now()}`,
      description: 'Created during integration tests'
    }

    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newCategory)
      .expect('Content-Type', /json/)
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('id')
        expect(res.body.name).toBe(newCategory.name)
        expect(res.body.description).toBe(newCategory.description)
      }
      )
  })

  it('should return all categories', async () => {
    await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(1)
        expect(res.body[0]).toStrictEqual({
          id: expect.any(Number),
          name: expect.stringContaining('Test-Category-'),
          description: "Created during integration tests"
        })
      })
  })

  it('should return a specific category by name', async () => {
    const categoriesResponse = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(1)
      })

    const categoryName = categoriesResponse.body[0].name

    await request(app)
      .get(`/api/categories/${categoryName}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id')
        expect(res.body.name).toBe(categoryName)
        expect(res.body.description).toBe("Created during integration tests")
      }
      )
  })
})