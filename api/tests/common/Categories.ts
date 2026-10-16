import request from 'supertest'
import type { Express } from 'express'
import Category from '@/models/Category'
import { Endpoints } from '@@/testutils/common/constants'

/** Creates a category with the given name, description and linked attributes as the given user, and returns it. */
export const createTestCategory = async (
  app: Express, authToken: string, name: string, description: string, attributeIds: number[] = [],
): Promise<Category> => {
  const categoryRes = await request(app)
    .post(Endpoints.CATEGORIES_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name, description, attributeIds })
    .expect(201)
  return categoryRes.body as Category
}
