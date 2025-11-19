import request from 'supertest'
import type { Express } from 'express'
import Attribute from '@/models/Attribute'
import Category from '@/models/Category'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'

export const cleanupAllAttributes = async (app: Express) => {
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

export const cleanupAllCategories = async (app: Express) => {
  const testAuthToken = await getAuthTokenFromFile()
  const categoriesRes = await request(app)
    .get(Endpoints.CATEGORIES_BASE_PATH)
    .set('Authorization', `Bearer ${testAuthToken}`)
    .expect(200)

  const categories = categoriesRes.body as Category[]
  for (const cat of categories) {
    await request(app)
      .delete(`${Endpoints.CATEGORIES_BASE_PATH}/${cat.id}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  }
}

export const cleanupAllItems = async (app: Express) => {
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
  const ratedItemsRes = await request(app)
    .get(Endpoints.RATINGS_BASE_PATH)
    .set('Authorization', `Bearer ${testAuthToken}`)
    .expect(200)
    
  const ratedItems = ratedItemsRes.body as RatedItem[]
  for (const rated of ratedItems) {
    await request(app)
      .delete(`${Endpoints.RATINGS_BASE_PATH}/${rated.id}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  }
}
