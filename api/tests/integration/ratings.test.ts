import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import Category from '@/models/Category'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
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
      .send({ name: `RatedItem-${Date.now()}`, description: 'For rated item tests', categoryId: testCategory.id })
      .expect(201)
    testItem = itemRes.body
  })

  afterAll(async () => {
    await cleanupAllRatedItems(app)
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
    it('should create a new rated item for the signed-in user', async () => {
      const newRatedItem = {
        item_id: testItem.id,
        rating: 5.00,
        notes: 'Excellent!'
      }

      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newRatedItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.id).toBeDefined()
          expect(ratedItem.item.name).toBe(testItem.name)
          expect(ratedItem.item.category.name).toBe(testCategory.name)
          expect(ratedItem.notes).toBe('Excellent!')
          expect(ratedItem.rating).toBe(5)
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
          expect(apiError.message).toBe('Missing required fields: item_id, rating')
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
          expect(updatedRatedItem.rating).toBe(5)
          expect(updatedRatedItem.item.id).toBe(testItem.id)
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
              expect(item.rating).toBe(5)
              expect(item.item.name).toBe(testItem.name)
            } else {
              expect(item.notes).toBeDefined()
              expect(item.id).toBeDefined()
              expect(item.rating).toBeDefined()
            }
          }
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/mine`, () => {
    it('should list only the ratings of the signed-in user', async () => {
      // GIVEN the admin test user rated the test item and another user rated nothing
      const otherUserToken = await getUserRoleAuthToken(app)

      // WHEN each user lists their own ratings
      const adminRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
      const otherUserRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)

      // THEN only the admin sees the test rating
      expect((adminRes.body as RatedItem[]).map((rating) => rating.id)).toEqual([testRatedItem.id])
      expect(otherUserRes.body).toEqual([])
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
          expect(ratedItem.rating).toBe(5)
          expect(ratedItem.item.name).toBe(testItem.name)
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

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/item/:item_id`, () => {
    it('should list every rating of the item, keeping each time a user rated it', async () => {
      // GIVEN another user rated the test item twice
      const otherUserToken = await getUserRoleAuthToken(app)
      for (const rating of [6, 8]) {
        await request(app)
          .post(Endpoints.RATINGS_BASE_PATH)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({ item_id: testItem.id, rating })
          .expect(201)
      }

      // WHEN the item's ratings are listed
      const res = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)

      // THEN the admin's rating and both of the other user's ratings come back, each with its rater and date
      const ratedItems = (res.body as RatedItem[]).sort((a, b) => a.id - b.id)
      expect(ratedItems.map((ratedItem) => ratedItem.rating)).toEqual([5, 6, 8])
      expect(ratedItems[0].userId).toBe(testRatedItem.userId)
      expect(ratedItems[1].userId).not.toBe(testRatedItem.userId)
      expect(ratedItems[2].userId).toBe(ratedItems[1].userId)
      expect(Number.isNaN(Date.parse(String(ratedItems[2].ratedAt)))).toBe(false)
    })

    it('should return no ratings for an item nobody rated', async () => {
      // GIVEN an item id nobody rated
      // WHEN its ratings are listed
      // THEN the list is empty
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => { expect(res.body).toEqual([]) })
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
