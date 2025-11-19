import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Item from '@/models/Item'
import Category from '@/models/Category'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllItems, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { Endpoints } from '@@/testutils/common/constants'

describe('Item API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testCategory: Category
  let testItem: Item

  beforeAll(async () => {
    await cleanupAllItems(app)
    await cleanupAllCategories(app)

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `ItemCat-${Date.now()}`, description: 'For item tests' })
      .expect(201)
    testCategory = categoryRes.body
  })

  beforeEach(() => {
    if (!testCategory) {
      throw new Error('Test category not initialized')
    }
  })

  describe(`POST ${Endpoints.ITEMS_BASE_PATH}`, () => {
    it('should create a new item', async () => {
      const newItem = {
        name: `Test-Item-${Date.now()}`,
        description: 'Item for integration test',
        category: testCategory.id
      }
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Item
          expect(apiResult.id).toBeDefined()
          //expect(apiResult.category.name).toBe(testCategory.name)
          expect(apiResult.name).toBe(newItem.name)
          expect(apiResult.description).toBe(newItem.description)
          //expect(Array.isArray(apiResult.ratings)).toBe(true)
          //expect(apiResult.ratings.length).toBe(0)
          //expect(Array.isArray(apiResult.attributes)).toBe(true)
          //expect(apiResult.attributes.length).toBe(0)
          testItem = apiResult
        })

      if (!testItem) {
        throw new Error('Test item not initialized after creation')
      }
    })

    it('should fail to create an item with missing name', async () => {
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name', categoryId: testCategory.id })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: name, category')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`GET ${Endpoints.ITEMS_BASE_PATH}`, () => {
    it('should get all items', async () => {
      if (!testItem) {
        throw new Error('Test item not initialized')
      }

      await request(app)
        .get(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const items = res.body as Item[]
          //const categoryNames = items.map(item => item.category?.name)
          expect(Array.isArray(items)).toBe(true)
          expect(items.length).toBe(1)
          for (const item of items) {
            if (item.id === testItem.id) {
              expect(item.name).toBe(testItem.name)
              expect(item.description).toBe(testItem.description)
              //expect(categoryNames).toContain(testCategory.name)
             // expect(Array.isArray(item.ratings)).toBe(true)
             // expect(Array.isArray(item.attributes)).toBe(true)
            } else {
              expect(item.id).toBeDefined()
              expect(item.name).toBeDefined()
              expect(item.description).toBeDefined()
              expect(item.category).toBeDefined()
              //expect(Array.isArray(item.ratings)).toBe(true)
              //expect(Array.isArray(item.attributes)).toBe(true)
            }
          }
        })
    })
  })

  describe(`GET ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    it('should get item by id', async () => {
      if (!testItem) {
        throw new Error('Test item not initialized')
      }

      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item).toHaveProperty('id')
          expect(item.id).toBe(testItem.id)
          expect(item.name).toBe(testItem.name)
          expect(item.description).toBe(testItem.description)
          //expect(item.category.name).toContain(testCategory.name)
          //expect(Array.isArray(item.ratings)).toBe(true)
          //expect(item.ratings.length).toBe(0)
          //expect(Array.isArray(item.attributes)).toBe(true)
         // expect(item.attributes.length).toBe(0)
        })
    })

    it('should fail to get a non-existent item', async () => {
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`PUT ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    it('should update an item', async () => {
      if (!testItem) {
        throw new Error('Test item not initialized')
      }

      const updatedDesc = 'Updated item description'
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: updatedDesc })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item.description).toBe(updatedDesc)
          expect(item.name).toBe(testItem.name)
          //expect(item.category.name).toContain(testCategory.name)
         //expect(Array.isArray(item.ratings)).toBe(true)
          //expect(item.ratings.length).toBe(0)
          //expect(Array.isArray(item.attributes)).toBe(true)
         // expect(item.attributes.length).toBe(0)
        })
    })

    it('should fail to update a non-existent item', async () => {
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    it('should delete an item', async () => {
      if (!testItem) {
        throw new Error('Test item not initialized')
      }

      await request(app)
        .delete(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent item', async () => {
      await request(app)
        .delete(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.body).toEqual({}) })
    })
  })
})
