import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import Category from '@/models/Category'
import APIError from '@/models/APIError'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllCategories } from '@@/testutils/common/DataCleanup'

export const CATEGORIES_BASE_PATH = '/api/categories'

describe('Category API Integration Tests', async () => {
  const app = await appReady
  let createdCategory: Category
  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`POST ${CATEGORIES_BASE_PATH}`, () => {
    it('should create a new category when authorized', async () => {
      const newCategory = {
        name: `Test-Category-${Date.now()}`,
        description: 'Created during integration tests'
      } as Category

      await request(app)
        .post(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newCategory)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe(newCategory.name)
          expect(apiResult.description).toBe(newCategory.description)
          createdCategory = apiResult
        })
    })

    it('should fail to create a category with missing name', async () => {
      await request(app)
        .post(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Name is required')
          expect(apiError.code).toBe('Bad Request')
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail to create a category when unauthorized', async () => {
      await request(app)
        .post(CATEGORIES_BASE_PATH)
        .set('Authorization', '')
        .send({ name: 'Unauthorized-Category', description: 'Should not be created' })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Authentication required')
          expect(apiError.code).toBe('Unauthorized')
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe(`PUT ${CATEGORIES_BASE_PATH}/:name`, () => {
    it('should update a category', async () => {
      const updatedDesc = 'Updated category description'
      await request(app)
        .put(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: updatedDesc })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.description).toBe(updatedDesc)
          expect(apiResult.name).toBe(createdCategory.name)
          expect(apiResult.id).toBe(createdCategory.id)
        })
    })

    it('should fail to update a category with missing name', async () => {
      await request(app)
        .put(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: '' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Name is required')
          expect(apiError.code).toBe('Bad Request')
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail to update a non-existent category', async () => {
      await request(app)
        .put(`${CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })

    it('should fail to update a category when unauthorized', async () => {
      await request(app)
        .put(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', '')
        .send({ description: 'Unauthorized update attempt' })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Authentication required')
          expect(apiError.code).toBe('Unauthorized')
          expect(apiError.status).toBe(401)
        })
    })

    it('should fail when updating a category to a name that already exists', async () => {
      // First, create another category to cause a name conflict
      const anotherCategory = {
        name: `Another-Category-${Date.now()}`,
        description: 'Another category for name conflict test'
      } as Category

      await request(app)
        .post(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(anotherCategory)
        .expect(201)

      // Now, attempt to update the original category to have the same name
      await request(app)
        .put(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: anotherCategory.name })
        .expect('Content-Type', /json/)
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category name already exists')
          expect(apiError.code).toBe('RESOURCE_ALREADY_EXISTS')
          expect(apiError.status).toBe(422)
        })
    })
  })

  describe(`GET ${CATEGORIES_BASE_PATH}`, () => {
    it('should return all categories', async () => {
      await request(app)
        .get(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBe(4)
          const apiResult = res.body[0] as Category
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBeDefined()
          expect(apiResult.description).toBeDefined()
          expect(apiResult.name).toContain('Test-Category-')
          expect(apiResult.description).toBe('Created during integration tests')
        })
    })

    it('should fail to get categories when unauthorized', async () => {
      await request(app)
        .get(CATEGORIES_BASE_PATH)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Authentication required')
          expect(apiError.code).toBe('Unauthorized')
          expect(apiError.status).toBe(401)
        })
    })

    it('should return an empty array when no categories exist', async () => {
      // First, delete existing categories
      const categoriesResponse = await request(app)
        .get(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)

      const categories = categoriesResponse.body
      for (const category of categories) {
        await request(app)
          .delete(`${CATEGORIES_BASE_PATH}/${category.name}`)
          .set('Authorization', `Bearer ${testAuthToken}`)
          .expect(204)
      }

      // Now, get categories and expect an empty array
      await request(app)
        .get(CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBe(0)
        })
    })
  })

  describe(`GET ${CATEGORIES_BASE_PATH}/:name`, () => {
    it('should return a specific category by name', async () => {
      await request(app)
        .get(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.id).toBe(createdCategory.id)
          expect(apiResult.name).toBe(createdCategory.name)
          expect(apiResult.description).toBe('Created during integration tests')
        })
    })

    it('should fail to get a non-existent category', async () => {
      await request(app)
        .get(`${CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })

    it('should fail to get a category when unauthorized', async () => {
      await request(app)
        .get(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Authentication required')
          expect(apiError.code).toBe('Unauthorized')
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe(`DELETE ${CATEGORIES_BASE_PATH}/:name`, () => {
    it('should delete a category', async () => {
      await request(app)
        .delete(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent category', async () => {
      await request(app)
        .delete(`${CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category not found')
          expect(apiError.code).toBe('Not Found')
          expect(apiError.status).toBe(404)
        })
    })

    it('should fail to delete a category when unauthorized', async () => {
      await request(app)
        .delete(`${CATEGORIES_BASE_PATH}/${createdCategory.name}`)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Authentication required')
          expect(apiError.code).toBe('Unauthorized')
          expect(apiError.status).toBe(401)
        })
    })
  })
})