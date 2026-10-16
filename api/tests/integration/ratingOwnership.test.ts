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

describe('Rating ownership', async () => {
  const app = await appReady
  const adminToken = await getAuthTokenFromFile()
  let ownerToken: string
  let otherUserToken: string
  let testItem: Item
  let otherItem: Item

  beforeAll(async () => {
    await cleanupAllCategories(app)
    ownerToken = await getUserRoleAuthToken(app)
    otherUserToken = await getUserRoleAuthToken(app)
    testItem = await createTestItem(app, adminToken, 'Owned')
    otherItem = await createTestItem(app, adminToken, 'OtherOwned')
  })

  beforeEach(async () => {
    await cleanupAllRatedItems(app)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`PUT ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should let the author change their rating', async () => {
      // GIVEN a 5 rating by its author
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)

      // WHEN the author changes it to 8 with a note
      // THEN the new grade and note come back
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rating: 8, notes: 'Better the second time' })
        .expect(200)
        .expect(res => {
          const updated = res.body as RatedItem
          expect(updated.rating).toBe(8)
          expect(updated.notes).toBe('Better the second time')
        })
    })

    it('should reject another user changing the rating', async () => {
      // GIVEN a 5 rating by its author
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)

      // WHEN another user tries to change it
      const res = await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ rating: 1 })
        .expect(403)

      // THEN it is forbidden and the rating keeps its grade
      const apiError = res.body as APIError
      expect(apiError.code).toBe(ErrorCode.FORBIDDEN)
      expect(apiError.status).toBe(403)
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect(getRes => { expect((getRes.body as RatedItem).rating).toBe(5) })
    })

    it('should keep the rating on its item and author whatever else the body sends', async () => {
      // GIVEN a 5 rating by its author and a rating by another user, whose id the body will send
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)
      const otherUserRating = await createTestRating(app, otherUserToken, otherItem.id, 3)

      // WHEN the author sends the other item and the other user along with a new grade
      // THEN only the grade changes
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rating: 7, item: { id: otherItem.id }, user: { id: otherUserRating.userId } })
        .expect(200)
        .expect(res => {
          const updated = res.body as RatedItem
          expect(updated.rating).toBe(7)
          expect(updated.item.id).toBe(testItem.id)
          expect(updated.userId).toBe(ratedItem.userId)
        })
    })
  })

  describe(`DELETE ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should reject another user deleting the rating', async () => {
      // GIVEN a 5 rating by its author
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)

      // WHEN another user tries to delete it
      // THEN it is forbidden and the rating is still there
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
    })

    it('should let the author delete their rating', async () => {
      // GIVEN a 5 rating by its author
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)

      // WHEN the author deletes it
      // THEN the delete succeeds
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204)
    })

    it('should let an admin delete another user\'s rating', async () => {
      // GIVEN a 5 rating by a user who is not the admin
      const ratedItem = await createTestRating(app, ownerToken, testItem.id, 5)

      // WHEN the admin deletes it
      // THEN the delete succeeds
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204)
    })
  })
})
