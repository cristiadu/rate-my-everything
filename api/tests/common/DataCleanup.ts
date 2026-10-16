import request from 'supertest'
import type { Express } from 'express'
import Attribute from '@/models/Attribute'
import Category from '@/models/Category'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'

/** Deletes every attribute, after the items whose values use them. */
export const cleanupAllAttributes = async (app: Express) => {
  await cleanupAllItems(app)
  const testAuthToken = await getAuthTokenFromFile()
  const attributesRes = await request(app)
    .get(Endpoints.ATTRIBUTES_BASE_PATH)
    .set('Authorization', `Bearer ${testAuthToken}`)
    .expect(200)

  const attributes = attributesRes.body as Attribute[]
  for (const attr of attributes) {
    await request(app)
      .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attr.id}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  }
}

/** Deletes every category by name, after the items filed under them. */
export const cleanupAllCategories = async (app: Express) => {
  await cleanupAllItems(app)
  const testAuthToken = await getAuthTokenFromFile()
  const categoriesRes = await request(app)
    .get(Endpoints.CATEGORIES_BASE_PATH)
    .set('Authorization', `Bearer ${testAuthToken}`)
    .expect(200)

  const categories = categoriesRes.body as Category[]
  for (const cat of categories) {
    await request(app)
      .delete(`${Endpoints.CATEGORIES_BASE_PATH}/${encodeURIComponent(cat.name)}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  }
}

/** Deletes every item, after the ratings that reference them. */
export const cleanupAllItems = async (app: Express) => {
  await cleanupAllRatedItems(app)
  const testAuthToken = await getAuthTokenFromFile()
  const itemsRes = await request(app)
    .get(Endpoints.ITEMS_BASE_PATH)
    .set('Authorization', `Bearer ${testAuthToken}`)
    .expect(200)

  const items = itemsRes.body as Item[]
  for (const item of items) {
    await request(app)
      .delete(`${Endpoints.ITEMS_BASE_PATH}/${item.id}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  }
}

export const cleanupAllRatedItems = async (app: Express) => {
  const testAuthToken = await getAuthTokenFromFile()
  // Other users' older ratings only show up once their latest one is gone, so keep going until none are left
  let ratedItems: RatedItem[]
  do {
    const ratedItemsRes = await request(app)
      .get(Endpoints.RATINGS_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(200)
    ratedItems = ratedItemsRes.body as RatedItem[]
    for (const rated of ratedItems) {
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${rated.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    }
  } while (ratedItems.length > 0)
}
