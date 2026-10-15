import request from 'supertest'
import type { Express } from 'express'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import { Endpoints } from '@@/testutils/common/constants'

/** Creates an attribute with the given name and value type as the given user, and returns it. */
export const createTestAttribute = async (
  app: Express, authToken: string, name: string, valueType: AttributeValueType,
): Promise<Attribute> => {
  const attributeRes = await request(app)
    .post(Endpoints.ATTRIBUTES_BASE_PATH)
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name, valueType })
    .expect(201)
  return attributeRes.body as Attribute
}
