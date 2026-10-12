import request from 'supertest'
import type { Express } from 'express'
import Category from '@/models/Category'
import Item from '@/models/Item'
import { Endpoints } from '@@/testutils/common/constants'

/** Creates a category and one item in it as the given user, and returns the item. */
export const createTestItem = async (app: Express, authToken: string, namePrefix: string): Promise<Item> => {
  const categoryRes = await request(app)
    .post(Endpoints.CATEGORIES_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: `${namePrefix}Cat-${Date.now()}`, description: `For ${namePrefix} tests` })
    .expect(201)
  const category = categoryRes.body as Category

  const itemRes = await request(app)
    .post(Endpoints.ITEMS_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: `${namePrefix}Item-${Date.now()}`, description: `For ${namePrefix} tests`, categoryId: category.id })
    .expect(201)
  return itemRes.body as Item
}
