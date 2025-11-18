import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { CATEGORIES_BASE_PATH } from '@@/testutils/integration/category.test'
import APIError from '@/models/APIError'
import Item from '@/models/Item'
import Category from '@/models/Category'
import { cleanupAllItems, cleanupAllCategories } from '@@/testutils/common/DataCleanup'

export const ITEMS_BASE_PATH = '/api/items'

describe('Item API Integration Tests', async () => {
  const app = await appReady
  let testCategory: Category
  let testItem: Item
  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    await cleanupAllItems(app)
    await cleanupAllCategories(app)

    // Create a category for item association
    const categoryRes = await request(app)
      .post(CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `ItemCat-${Date.now()}`, description: 'For item tests' })
      .expect(201)
    testCategory = categoryRes.body
  })

  describe(`POST ${ITEMS_BASE_PATH}`, () => {
    it('should create a new item', async () => {
      const newItem = {
        name: `Test-Item-${Date.now()}`,
        description: 'Item for integration test',
        categoryId: testCategory.id
      }
      await request(app)
        .post(ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Item
          expect(apiResult.id).toBeDefined()
          expect(apiResult.category.name).toBe(testCategory.name)
          expect(apiResult.name).toBe(newItem.name)
          expect(apiResult.description).toBe(newItem.description)
          expect(Array.isArray(apiResult.ratings)).toBe(true)
          expect(apiResult.ratings.length).toBe(0)
          expect(Array.isArray(apiResult.attributes)).toBe(true)
          expect(apiResult.attributes.length).toBe(0)
          testItem = apiResult
        })
    })

    it('should fail to create an item with missing name', async () => {
      await request(app)
        .post(ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name', categoryId: testCategory.id })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: name, category')
          expect(apiError.code).toBe('VALIDATION_ERROR')
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`GET ${ITEMS_BASE_PATH}`, () => {
    it('should get all items', async () => {
      await request(app)
        .get(ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const items = res.body as Item[]
          const categoryNames = items.map(item => item.category.name)
          expect(Array.isArray(items)).toBe(true)
          expect(items.length).toBe(2)
          for (const item of items) {
            if (item.id === testItem.id) {
              expect(item.name).toBe(testItem.name)
              expect(item.description).toBe(testItem.description)
              expect(categoryNames).toContain(testCategory.name)
              expect(Array.isArray(item.ratings)).toBe(true)
              expect(Array.isArray(item.attributes)).toBe(true)
            } else {
              expect(item.id).toBeDefined()
              expect(item.name).toBeDefined()
              expect(item.description).toBeDefined()
              expect(item.category).toBeDefined()
              expect(Array.isArray(item.ratings)).toBe(true)
              expect(Array.isArray(item.attributes)).toBe(true)
            }
          }
        })
    })
  })

  describe(`GET ${ITEMS_BASE_PATH}/:id`, () => {
    it('should get item by id', async () => {
      await request(app)
        .get(`${ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item).toHaveProperty('id')
          expect(item.id).toBe(testItem.id)
          expect(item.name).toBe(testItem.name)
          expect(item.description).toBe(testItem.description)
          expect(item.category.name).toContain(testCategory.name)
          expect(Array.isArray(item.ratings)).toBe(true)
          expect(item.ratings.length).toBe(0)
          expect(Array.isArray(item.attributes)).toBe(true)
          expect(item.attributes.length).toBe(0)
        })
    })

    it('should fail to get a non-existent item', async () => {
      await request(app)
        .get(`${ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe('NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`PUT ${ITEMS_BASE_PATH}/:id`, () => {
    it('should update an item', async () => {
      const updatedDesc = 'Updated item description'
      await request(app)
        .put(`${ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: updatedDesc })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item.description).toBe(updatedDesc)
          expect(item.name).toBe(testItem.name)
          expect(item.category.name).toContain(testCategory.name)
          expect(Array.isArray(item.ratings)).toBe(true)
          expect(item.ratings.length).toBe(0)
          expect(Array.isArray(item.attributes)).toBe(true)
          expect(item.attributes.length).toBe(0)
        })
    })

    it('should fail to update a non-existent item', async () => {
      await request(app)
        .put(`${ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe('NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${ITEMS_BASE_PATH}/:id`, () => {
    it('should delete an item', async () => {
      await request(app)
        .delete(`${ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent item', async () => {
      await request(app)
        .delete(`${ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.body).toEqual({}) })
    })
  })
})
