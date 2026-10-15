import request from 'supertest'
import type { Express } from 'express'
import Item, { AttributeValueInput } from '@/models/Item'
import { Endpoints } from '@@/testutils/common/constants'
import { createTestCategory } from '@@/testutils/common/Categories'

/** Creates an item with the given name, description and attribute values in an existing category, and returns it. */
export const createTestItemInCategory = async (
  app: Express, authToken: string, categoryId: number, name: string, description: string, attributeValues: AttributeValueInput[] = [],
): Promise<Item> => {
  const itemRes = await request(app)
    .post(Endpoints.ITEMS_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name, description, categoryId, attributeValues })
    .expect(201)
  return itemRes.body as Item
}

/** Creates a category and one item in it as the given user, and returns the item. */
export const createTestItem = async (app: Express, authToken: string, namePrefix: string): Promise<Item> => {
  const category = await createTestCategory(app, authToken, `${namePrefix}Cat-${Date.now()}`, `For ${namePrefix} tests`)
  return createTestItemInCategory(app, authToken, category.id, `${namePrefix}Item-${Date.now()}`, `For ${namePrefix} tests`)
}
