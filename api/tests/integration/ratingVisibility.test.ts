import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import RankingScope from '@/models/RankingScope'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories, cleanupAllRatedItems } from '@@/testutils/common/DataCleanup'
import { createTestItem } from '@@/testutils/common/Items'
import { createTestRating } from '@@/testutils/common/Ratings'
import { Endpoints } from '@@/testutils/common/constants'

describe('Other users\' latest ratings', async () => {
  const app = await appReady
  const adminToken = await getAuthTokenFromFile()
  let raterToken: string
  let testItem: Item

  beforeAll(async () => {
    await cleanupAllCategories(app)
    raterToken = await getUserRoleAuthToken(app)
    testItem = await createTestItem(app, adminToken, 'Visible')
  })

  beforeEach(async () => {
    await cleanupAllRatedItems(app)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/user/:user_id`, () => {
    it('should show another user only the latest rating of each item, and the user all of their own', async () => {
      // GIVEN a user rated the test item 2 and then 9
      await createTestRating(app, raterToken, testItem.id, 2)
      const latestRating = await createTestRating(app, raterToken, testItem.id, 9)

      // WHEN the admin and the user each list that user's ratings
      const adminRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/user/${latestRating.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
      const raterRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/user/${latestRating.userId}`)
        .set('Authorization', `Bearer ${raterToken}`)
        .expect(200)

      // THEN the admin sees only the 9, and the user sees both
      expect((adminRes.body as RatedItem[]).map((ratedItem) => ratedItem.id)).toEqual([latestRating.id])
      expect((raterRes.body as RatedItem[]).map((ratedItem) => ratedItem.rating).sort()).toEqual([2, 9])
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH} with a grade range`, () => {
    it('should work out the collective grade from each user\'s latest rating only', async () => {
      // GIVEN a user rated the test item 2 and then 9, so its average would be 5.5 but its latest is 9
      await createTestRating(app, raterToken, testItem.id, 2)
      await createTestRating(app, raterToken, testItem.id, 9)

      // WHEN everyone's ratings are filtered to a collective grade of 8 or more
      const res = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}?scope=${RankingScope.ALL}&minGrade=8`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // THEN the item is kept, with only the latest rating
      expect((res.body as RatedItem[]).map((ratedItem) => ratedItem.rating)).toEqual([9])
    })
  })
})
