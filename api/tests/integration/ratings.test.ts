import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { TEST_USER } from '@@/testutils/setup'
import { CATEGORIES_BASE_PATH } from '@@/testutils/integration/category.test'
import { ITEMS_BASE_PATH } from '@@/testutils/integration/item.test'
import APIError from '@/models/APIError'
import Category from '@/models/Category'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { cleanupAllRatedItems, cleanupAllItems, cleanupAllCategories } from '../common/DataCleanup'

export const RATINGS_BASE_PATH = '/api/ratings'

describe('RatedItem API Integration Tests', async () => {
  const app = await appReady
  let testCategory: Category
  let testItem: Item
  let testRatedItem: RatedItem
  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    await cleanupAllRatedItems(app)
    await cleanupAllItems(app)
    await cleanupAllCategories(app)
    
    // Create a category and item for rated item association
    const categoryRes = await request(app)
      .post(CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `RatedCat-${Date.now()}`, description: 'For rated item tests' })
      .expect(201)
    testCategory = categoryRes.body

    const itemRes = await request(app)
      .post(ITEMS_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `RatedItem-${Date.now()}`, description: 'For rated item tests', categoryId: testCategory.id })
      .expect(201)
    testItem = itemRes.body
  })

  describe(`POST ${RATINGS_BASE_PATH}`, () => {
    it('should create a new rated item', async () => {
      const newRatedItem = {
        itemId: testItem.id,
        rating: 5,
        notes: 'Excellent!'
      } as Partial<RatedItem>

      await request(app)
        .post(`${RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newRatedItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.id).toBeDefined()
          expect(ratedItem.item).toBeDefined()
          expect(ratedItem.notes).toBe("Excellent!")
          expect(ratedItem.rating).toBe(5)
          expect(ratedItem.user.username).toBe(TEST_USER.email)
          expect(ratedItem.rating).toBe(5)
          testRatedItem = ratedItem
        })
    })

    it('should fail to create a rated item with missing itemId', async () => {
      await request(app)
        .post(`${RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ rating: 5, comment: 'Missing itemId' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: item_id, user_id, rating')
          expect(apiError.code).toBe('VALIDATION_ERROR')
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`PUT ${RATINGS_BASE_PATH}/:id`, () => {
    it('should update a rated item', async () => {
      const updatedComment = 'Updated comment'
      await request(app)
        .put(`${RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ notes: updatedComment } as Partial<RatedItem>)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const updatedRatedItem = res.body as RatedItem
          expect(updatedRatedItem.notes).toBe(updatedComment)
          expect(updatedRatedItem.id).toBe(testRatedItem.id)
          expect(updatedRatedItem.user.username).toBe(TEST_USER.email)
          expect(updatedRatedItem.rating).toBe(testRatedItem.rating)
          expect(updatedRatedItem.item.id).toBe(testRatedItem.item.id)
          expect(updatedRatedItem.item.name).toBe(testRatedItem.item.name)
        })
    })

    it('should fail to update a non-existent rated item', async () => {
      await request(app)
        .put(`${RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ comment: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`GET ${RATINGS_BASE_PATH}`, () => {
    it('should get all rated items', async () => {
      await request(app)
        .get(`${RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItems = res.body as RatedItem[]
          expect(Array.isArray(ratedItems)).toBe(true)
          expect(ratedItems.length).toBe(6)
          for (const item of ratedItems) {
            if (item.id === testRatedItem.id) {
              expect(item.notes).toBe(testRatedItem.notes)
              expect(item.id).toBe(testRatedItem.id)
              expect(item.user.username).toBe(TEST_USER.email)
              expect(item.rating).toBe(testRatedItem.rating)
              expect(item.item.id).toBe(testRatedItem.item.id)
              expect(item.item.name).toBe(testRatedItem.item.name)
            } else {
              expect(item.notes).toBeDefined()
              expect(item.id).toBeDefined()
              expect(item.user.username).toBeDefined()
              expect(item.rating).toBeDefined()
              expect(item.item.id).toBeDefined()
              expect(item.item.name).toBeDefined()
            }
          }
        })
    })
  })

  describe(`GET ${RATINGS_BASE_PATH}/:id`, () => {
    it('should get rated item by id', async () => {
      await request(app)
        .get(`${RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.notes).toBe(testRatedItem.notes)
          expect(ratedItem.id).toBe(testRatedItem.id)
          expect(ratedItem.user.username).toBe(TEST_USER.email)
          expect(ratedItem.rating).toBe(testRatedItem.rating)
          expect(ratedItem.item.id).toBe(testRatedItem.item.id)
          expect(ratedItem.item.name).toBe(testRatedItem.item.name)
        })
    })

    it('should fail to get a non-existent rated item', async () => {
      await request(app)
        .get(`${RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${RATINGS_BASE_PATH}`, () => {
    it('should delete a rated item', async () => {
      await request(app)
        .delete(`${RATINGS_BASE_PATH}/${testRatedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent rated item', async () => {
      await request(app)
        .delete(`${RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe('Not Found')
          expect(apiError.status).toBe(404)
        })
    })
  })
})
