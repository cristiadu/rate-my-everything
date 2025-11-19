import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import Category from '@/models/Category'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllRatedItems, cleanupAllItems, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { Endpoints } from '@@/testutils/common/constants'

describe('RatedItem API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testCategory: Category
  let testItem: Item
  let testRatedItem: RatedItem

  beforeAll(async () => {
    await cleanupAllRatedItems(app)
    await cleanupAllItems(app)
    await cleanupAllCategories(app)

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `RatedCat-${Date.now()}`, description: 'For rated item tests' })
      .expect(201)
    testCategory = categoryRes.body

    const itemRes = await request(app)
      .post(Endpoints.ITEMS_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `RatedItem-${Date.now()}`, description: 'For rated item tests', category: testCategory.id })
      .expect(201)
    testItem = itemRes.body
  })

  beforeEach(() => {
    if (!testCategory) {
      throw new Error('Test category not initialized')
    }

    if (!testItem) {
      throw new Error('Test item not initialized')
    }
  })

  describe(`POST ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should create a new rated item', async () => {
      const newRatedItem = {
        item_id: testItem.id,
        rating: 5.00,
        user_id: 1,
        notes: 'Excellent!'
      } as Partial<RatedItem>

      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newRatedItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.id).toBeDefined()
          //expect(ratedItem.item).toBeDefined()
          expect(ratedItem.notes).toBe(newRatedItem.notes)
          expect(ratedItem.rating).toBe(newRatedItem.rating)
          //expect(ratedItem.user.username).toBe(TEST_USER.email)
          testRatedItem = ratedItem
        })

      if (!testRatedItem) {
        throw new Error('Test rated item not initialized after creation')
      }
    })

    it('should fail to create a rated item with missing itemId', async () => {
      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ rating: 5, comment: 'Missing itemId' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: item_id, user_id, rating')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`PUT ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should update a rated item', async () => {
      if (!testRatedItem) {
        throw new Error('Test rated item not initialized')
      }

      const updatedComment = 'Updated comment'
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ notes: updatedComment } as Partial<RatedItem>)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const updatedRatedItem = res.body as RatedItem
          expect(updatedRatedItem.notes).toBe(updatedComment)
          expect(updatedRatedItem.id).toBe(testRatedItem.id)
          //expect(updatedRatedItem.user.username).toBe(TEST_USER.email)
          expect(updatedRatedItem.rating).toBe(testRatedItem.rating.toFixed(2))
          //expect(updatedRatedItem.item.id).toBe(testRatedItem.item.id)
          //expect(updatedRatedItem.item.name).toBe(testRatedItem.item.name)
          testRatedItem = updatedRatedItem
        })

        if (!testRatedItem) {
          throw new Error('Test rated item not initialized after update')
        }
    })

    it('should fail to update a non-existent rated item', async () => {
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ comment: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should get all rated items', async () => {
      if (!testRatedItem) {
        throw new Error('Test rated item not initialized')
      }
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItems = res.body as RatedItem[]
          expect(Array.isArray(ratedItems)).toBe(true)
          expect(ratedItems.length).toBe(1)
          for (const item of ratedItems) {
            if (item.id === testRatedItem.id) {
              expect(item.notes).toBe(testRatedItem.notes)
              expect(item.id).toBe(testRatedItem.id)
              //expect(item.user.username).toBe(TEST_USER.email)
              expect(item.rating).toBe(testRatedItem.rating)
              //expect(item.item.id).toBe(testRatedItem.item.id)
              //expect(item.item.name).toBe(testRatedItem.item.name)
            } else {
              expect(item.notes).toBeDefined()
              expect(item.id).toBeDefined()
              //expect(item.user.username).toBeDefined()
              expect(item.rating).toBeDefined()
              //expect(item.item.id).toBeDefined()
              //expect(item.item.name).toBeDefined()
            }
          }
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should get rated item by id', async () => {
      if (!testRatedItem) {
        throw new Error('Test rated item not initialized')
      }

      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.notes).toBe(testRatedItem.notes)
          expect(ratedItem.id).toBe(testRatedItem.id)
          //expect(ratedItem.user.username).toBe(TEST_USER.email)
          expect(ratedItem.rating).toBe(testRatedItem.rating)
          //expect(ratedItem.item.id).toBe(testRatedItem.item.id)
          //expect(ratedItem.item.name).toBe(testRatedItem.item.name)
        })
    })

    it('should fail to get a non-existent rated item', async () => {
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should delete a rated item', async () => {
      if (!testRatedItem) {
        throw new Error('Test rated item not initialized')
      }
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should not fail when deleting a non-existent rated item', async () => {
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.body).toEqual({}) })
    })
  })
})
