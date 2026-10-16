import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories, cleanupAllRatedItems } from '@@/testutils/common/DataCleanup'
import { createTestItem } from '@@/testutils/common/Items'
import { createTestRating } from '@@/testutils/common/Ratings'
import { Endpoints } from '@@/testutils/common/constants'

describe('RatedItem API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testItem: Item

  beforeAll(async () => {
    await cleanupAllCategories(app)
    testItem = await createTestItem(app, testAuthToken, 'Rated')
  })

  beforeEach(async () => {
    await cleanupAllRatedItems(app)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`POST ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should create a new rated item for the signed-in user', async () => {
      // GIVEN the test item (beforeAll)
      // WHEN the admin rates it 5 with a note
      // THEN the rating comes back with its item, category, note and grade
      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ item_id: testItem.id, rating: 5.00, notes: 'Excellent!' })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.id).toBeDefined()
          expect(ratedItem.item.name).toBe(testItem.name)
          expect(ratedItem.item.category.name).toBe(testItem.category.name)
          expect(ratedItem.notes).toBe('Excellent!')
          expect(ratedItem.rating).toBe(5)
        })
    })

    it('should fail to create a rated item with missing itemId', async () => {
      // GIVEN a rating without an item_id
      // WHEN it is posted
      // THEN the request fails validation
      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ rating: 5, comment: 'Missing itemId' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe("Invalid request: input.item_id: 'item_id' is required")
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`PUT ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should update a rated item', async () => {
      // GIVEN a 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN its note is updated
      // THEN the new note comes back and the grade and item stay the same
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ notes: 'Updated comment' } as Partial<RatedItem>)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const updatedRatedItem = res.body as RatedItem
          expect(updatedRatedItem.notes).toBe('Updated comment')
          expect(updatedRatedItem.id).toBe(ratedItem.id)
          expect(updatedRatedItem.rating).toBe(5)
          expect(updatedRatedItem.item.id).toBe(testItem.id)
        })
    })

    it('should fail to update a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN updating it
      // THEN it is not found
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
      // GIVEN one 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN all ratings are listed
      // THEN only that rating comes back
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItems = res.body as RatedItem[]
          expect(ratedItems).toHaveLength(1)
          expect(ratedItems[0].id).toBe(ratedItem.id)
          expect(ratedItems[0].notes).toBe('Excellent!')
          expect(ratedItems[0].rating).toBe(5)
          expect(ratedItems[0].item.name).toBe(testItem.name)
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/mine`, () => {
    it('should list only the ratings of the signed-in user', async () => {
      // GIVEN the admin rated the test item and another user rated nothing
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5)
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
      expect((adminRes.body as RatedItem[]).map((rating) => rating.id)).toEqual([ratedItem.id])
      expect(otherUserRes.body).toEqual([])
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should get rated item by id', async () => {
      // GIVEN a 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN getting it by id
      // THEN its fields come back
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const fetchedRatedItem = res.body as RatedItem
          expect(fetchedRatedItem.notes).toBe('Excellent!')
          expect(fetchedRatedItem.id).toBe(ratedItem.id)
          expect(fetchedRatedItem.rating).toBe(5)
          expect(fetchedRatedItem.item.name).toBe(testItem.name)
        })
    })

    it('should fail to get a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN getting it by id
      // THEN it is not found
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
    it('should list all of my ratings of the item and only the latest of each other user', async () => {
      // GIVEN the admin rated the test item 5 and another user rated it 6 and then 8
      const adminRating = await createTestRating(app, testAuthToken, testItem.id, 5)
      const otherUserToken = await getUserRoleAuthToken(app)
      await createTestRating(app, otherUserToken, testItem.id, 6)
      await createTestRating(app, otherUserToken, testItem.id, 8)

      // WHEN the admin and the other user each list the item's ratings
      const adminRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
      const otherUserRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/${testItem.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)

      // THEN the admin sees their own rating and only the other user's latest 8, each with its rater and date,
      // and the other user sees both of their own ratings next to the admin's
      const adminView = (adminRes.body as RatedItem[]).sort((a, b) => a.id - b.id)
      expect(adminView.map((ratedItem) => ratedItem.rating)).toEqual([5, 8])
      expect(adminView[0].userId).toBe(adminRating.userId)
      expect(adminView[1].userId).not.toBe(adminRating.userId)
      expect(Number.isNaN(Date.parse(String(adminView[1].ratedAt)))).toBe(false)
      const otherUserView = (otherUserRes.body as RatedItem[]).sort((a, b) => a.id - b.id)
      expect(otherUserView.map((ratedItem) => ratedItem.rating)).toEqual([5, 6, 8])
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
      // GIVEN a rating of the test item
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5)

      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })

    it('should not fail when deleting a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN deleting it
      // THEN the delete still succeeds with no body
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.text).toBe('') })
    })
  })
})
