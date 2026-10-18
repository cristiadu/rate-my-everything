import request from 'supertest'
import type { Express } from 'express'
import Attribute from '@/models/Attribute'
import type { AttributeValueResponse } from '@/models/AttributeValue'
import AttributeValueType from '@/models/AttributeValueType'
import { Endpoints } from '@@/testutils/common/constants'

/** Creates an attribute with the given name, value type and, for currency attributes, currency code as the given user, and returns it. */
export const createTestAttribute = async (
  app: Express, authToken: string, name: string, valueType: AttributeValueType, currencyCode?: string,
): Promise<Attribute> => {
  const attributeRes = await request(app)
    .post(Endpoints.ATTRIBUTES_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name, valueType, currencyCode })
    .expect(201)
  return attributeRes.body as Attribute
}

/** Stores a value of an attribute for an item through the attribute values endpoint as the given user, and returns it. */
export const createTestAttributeValue = async (
  app: Express, authToken: string, itemId: number, attributeId: number, value: string,
): Promise<AttributeValueResponse> => {
  const valueRes = await request(app)
    .post(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ value, item: { id: itemId }, attribute: { id: attributeId } })
    .expect(201)
  return valueRes.body as AttributeValueResponse
}
