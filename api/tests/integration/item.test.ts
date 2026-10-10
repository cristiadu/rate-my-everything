import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Item from '@/models/Item'
import Category from '@/models/Category'
import Attribute from '@/models/Attribute'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllItems, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { Endpoints } from '@@/testutils/common/constants'

describe('Item API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testCategory: Category
  let testItem: Item
  let pagesAttribute: Attribute
  let unlinkedAttribute: Attribute

  beforeAll(async () => {
    await cleanupAllItems(app)
    await cleanupAllCategories(app)

    const pagesRes = await request(app)
      .post(Endpoints.ATTRIBUTES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `Pages-${Date.now()}`, valueType: 'number' })
      .expect(201)
    pagesAttribute = pagesRes.body

    const unlinkedRes = await request(app)
      .post(Endpoints.ATTRIBUTES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `Unlinked-${Date.now()}`, valueType: 'string' })
      .expect(201)
    unlinkedAttribute = unlinkedRes.body

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `ItemCat-${Date.now()}`, description: 'For item tests', attributeIds: [pagesAttribute.id] })
      .expect(201)
    testCategory = categoryRes.body
  })

  beforeEach(() => {
    if (!testCategory) {
      throw new Error('Test category not initialized')
    }
  })

  describe(`POST ${Endpoints.ITEMS_BASE_PATH}`, () => {
    it('should create a new item with its attribute values', async () => {
      // GIVEN an item in the test category with a value for its Pages attribute
      const newItem = {
        name: `Test-Item-${Date.now()}`,
        description: 'Item for integration test',
        imageUrl: 'https://example.com/book.png',
        categoryId: testCategory.id,
        attributeValues: [{ attributeId: pagesAttribute.id, value: '320' }],
      }

      // WHEN it is created THEN the response carries its category and attribute values
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Item
          expect(apiResult.id).toBeDefined()
          expect(apiResult.category.name).toBe(testCategory.name)
          expect(apiResult.name).toBe(newItem.name)
          expect(apiResult.description).toBe('Item for integration test')
          expect(apiResult.imageUrl).toBe('https://example.com/book.png')
          expect(apiResult.attributes.map((value) => [value.attribute.id, value.value])).toEqual([[pagesAttribute.id, '320']])
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
          expect(apiError.message).toBe('Missing required fields: name, categoryId')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should reject a value for an attribute outside the item category', async () => {
      // GIVEN an item with a value for an attribute its category does not use
      const newItem = {
        name: `Wrong-Attribute-${Date.now()}`,
        description: 'Uses an unlinked attribute',
        categoryId: testCategory.id,
        attributeValues: [{ attributeId: unlinkedAttribute.id, value: 'nope' }],
      }

      // WHEN it is created THEN the API refuses it as a validation error
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe(`Attributes ${unlinkedAttribute.id} do not belong to category "${testCategory.name}"`)
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should reject a category that does not exist', async () => {
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'No category', description: 'Missing category', categoryId: 999999 })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category 999999 does not exist')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
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
          expect(item.category.name).toBe(testCategory.name)
          expect(item.attributes.map((value) => value.value)).toEqual(['320'])
        })
    })

    it('should replace attribute values in place when new ones are sent', async () => {
      // GIVEN the test item already holds a Pages value
      const [currentValue] = testItem.attributes

      // WHEN a new Pages value is sent
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeValues: [{ attributeId: pagesAttribute.id, value: '412' }] })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          // THEN the same value row now holds the new value
          const item = res.body as Item
          expect(item.attributes.map((value) => [value.id, value.value])).toEqual([[currentValue.id, '412']])
        })
    })

    it('should remove attribute values that are left out', async () => {
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeValues: [] })
        .expect(200)
        .expect(res => expect((res.body as Item).attributes).toEqual([]))
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
