import request from 'supertest'
import type { Express } from 'express'
import RatedItem from '@/models/RatedItem'
import { Endpoints } from '@@/testutils/common/constants'

/** Rates an item as the given user, and returns the new rating. */
export const createTestRating = async (
  app: Express, authToken: string, itemId: number, rating: number, notes?: string,
): Promise<RatedItem> => {
  const ratingRes = await request(app)
    .post(Endpoints.RATINGS_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ item_id: itemId, rating, notes })
    .expect(201)
  return ratingRes.body as RatedItem
}
