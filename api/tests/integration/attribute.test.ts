import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import type { AttributeValueResponse } from '@/models/AttributeValue'
import AttributeValueType from '@/models/AttributeValueType'
import type Item from '@/models/Item'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllAttributes } from '@@/testutils/common/DataCleanup'
import { createTestAttribute, createTestAttributeValue } from '@@/testutils/common/Attributes'
import { createTestItem } from '@@/testutils/common/Items'
import { Endpoints } from '@@/testutils/common/constants'

describe('Attribute API Integration Tests', async () => {
  const testAuthToken = await getAuthTokenFromFile()
  const app = await appReady

  beforeAll(async () => {
    await cleanupAllAttributes(app)
  })

  describe(`POST ${Endpoints.ATTRIBUTES_BASE_PATH}`, () => {
    it('should create a new attribute', async () => {
      // GIVEN a new text attribute named Created-Attribute
      // WHEN an admin creates it
      // THEN it comes back with an id, its name and its value type
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Created-Attribute', valueType: AttributeValueType.STRING })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe('Created-Attribute')
          expect(apiResult.valueType).toBe(AttributeValueType.STRING)
        })
    })

    it('should fail to create an attribute with missing name', async () => {
      // GIVEN an attribute without a name or value type
      // WHEN an admin creates it
      // THEN the request fails validation
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe("Invalid request: input.name: 'name' is required; input.valueType: 'valueType' is required")
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail to create an attribute with an empty name', async () => {
      // GIVEN a number attribute whose name is empty
      // WHEN an admin creates it
      // THEN the request is rejected naming the required fields
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: '', valueType: AttributeValueType.NUMBER })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: name, valueType')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail to create an attribute with an unknown value type', async () => {
      // GIVEN an attribute whose value type is not an AttributeValueType
      const invalidAttribute = { name: `Invalid-Type-${Date.now()}`, valueType: 'colour' }

      // WHEN creating it
      const res = await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(invalidAttribute)

      // THEN it is rejected with the allowed value types
      const apiError = res.body as APIError
      expect(res.status).toBe(400)
      expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      const allowedValueTypes = Object.values(AttributeValueType).join("','")
      expect(apiError.message).toBe(`Invalid request: input.valueType: should be one of the following; ['${allowedValueTypes}']`)
    })
  })

  describe(`GET ${Endpoints.ATTRIBUTES_BASE_PATH}`, () => {
    beforeAll(async () => {
      await cleanupAllAttributes(app)
      await createTestAttribute(app, testAuthToken, 'Listed-Attribute', AttributeValueType.NUMBER)
    })

    it('should get all attributes', async () => {
      // GIVEN exactly the attribute Listed-Attribute (beforeAll)
      // WHEN listing attributes
      // THEN only it comes back
      await request(app)
        .get(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const attributes = res.body as Attribute[]
          expect(attributes.map((attr) => [attr.name, attr.valueType])).toEqual([['Listed-Attribute', AttributeValueType.NUMBER]])
        })
    })
  })

  describe(`GET ${Endpoints.ATTRIBUTES_BASE_PATH}/:id`, () => {
    let fetchedAttribute: Attribute

    beforeAll(async () => {
      fetchedAttribute = await createTestAttribute(app, testAuthToken, 'Fetched-Attribute', AttributeValueType.STRING)
    })

    it('should get attribute by id', async () => {
      // GIVEN the attribute Fetched-Attribute (beforeAll)
      // WHEN getting it by id
      // THEN its fields come back
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${fetchedAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBe(fetchedAttribute.id)
          expect(apiResult.name).toBe('Fetched-Attribute')
          expect(apiResult.valueType).toBe(AttributeValueType.STRING)
        })
    })

    it('should fail to get a non-existent attribute', async () => {
      // GIVEN no attribute with id 999999
      // WHEN getting it by id
      // THEN it is not found
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`PUT ${Endpoints.ATTRIBUTES_BASE_PATH}/:id`, () => {
    let attributeToUpdate: Attribute

    beforeEach(async () => {
      attributeToUpdate = await createTestAttribute(app, testAuthToken, `Update-Attribute-${Date.now()}`, AttributeValueType.STRING)
    })

    it('should update an attribute', async () => {
      // GIVEN a text attribute (beforeEach)
      // WHEN it is renamed
      // THEN the new name comes back and the value type stays text
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attributeToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Updated name' })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBe(attributeToUpdate.id)
          expect(apiResult.name).toBe('Updated name')
          expect(apiResult.valueType).toBe(AttributeValueType.STRING)
        })
    })

    it('should fail to update an attribute to an unknown value type', async () => {
      // GIVEN a text attribute (beforeEach)
      // WHEN changing its value type to one outside AttributeValueType
      const res = await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attributeToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ valueType: 'colour' })

      // THEN it is rejected and the attribute stays text
      expect(res.status).toBe(400)
      expect((res.body as APIError).code).toBe(ErrorCode.VALIDATION_ERROR)
      const current = await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attributeToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
      expect((current.body as Attribute).valueType).toBe(AttributeValueType.STRING)
    })

    it('should fail to update a non-existent attribute', async () => {
      // GIVEN no attribute with id 999999
      // WHEN updating it
      // THEN it is not found
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${Endpoints.ATTRIBUTES_BASE_PATH}/:id`, () => {
    it('should delete an attribute', async () => {
      // GIVEN an attribute
      const attributeToDelete = await createTestAttribute(app, testAuthToken, 'Delete-Attribute', AttributeValueType.STRING)

      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attributeToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${attributeToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })

    it('should not fail when deleting a non-existent attribute', async () => {
      // GIVEN no attribute with id 999999
      // WHEN deleting it
      // THEN the delete still succeeds with no body
      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.text).toBe('') })
    })
  })

  describe(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`, () => {
    let valueItem: Item
    let yearAttribute: Attribute
    let countryAttribute: Attribute
    let yearValue: AttributeValueResponse

    beforeAll(async () => {
      yearAttribute = await createTestAttribute(app, testAuthToken, `Year-${Date.now()}`, AttributeValueType.NUMBER)
      countryAttribute = await createTestAttribute(app, testAuthToken, `Country-${Date.now()}`, AttributeValueType.STRING)
      valueItem = await createTestItem(app, testAuthToken, 'AttributeValue')
      yearValue = await createTestAttributeValue(app, testAuthToken, valueItem.id, yearAttribute.id, '1965')
      await createTestAttributeValue(app, testAuthToken, valueItem.id, countryAttribute.id, 'United Kingdom')
    })

    it('should create an attribute value for an item', async () => {
      // GIVEN the country attribute and an item (beforeAll)
      // WHEN an admin stores a country for the item
      // THEN the value comes back with an id
      await request(app)
        .post(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ value: 'Ireland', item: { id: valueItem.id }, attribute: { id: countryAttribute.id } })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as AttributeValueResponse
          expect(apiResult.id).toBeDefined()
          expect(apiResult.value).toBe('Ireland')
        })
    })

    it('should fail to create an attribute value without its item and attribute', async () => {
      // GIVEN a value that names neither its item nor its attribute
      // WHEN an admin stores it
      // THEN the request fails validation
      await request(app)
        .post(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ value: 'Orphan' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe("Invalid request: input.item: 'item' is required; input.attribute: 'attribute' is required")
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should list every attribute value', async () => {
      // GIVEN the year value 1965 (beforeAll)
      // WHEN listing every attribute value
      // THEN it is among them
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body as AttributeValueResponse[]).toContainEqual({ id: yearValue.id, value: '1965' })
        })
    })

    it('should get an attribute value by id', async () => {
      // GIVEN the year value 1965 (beforeAll)
      // WHEN getting it by id
      // THEN its value comes back
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/${yearValue.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({ id: yearValue.id, value: '1965' })
        })
    })

    it('should fail to get a non-existent attribute value', async () => {
      // GIVEN no attribute value with id 999999
      // WHEN getting it by id
      // THEN it is not found
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute value not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })

    it('should list only the values of the given attribute', async () => {
      // GIVEN the item holds a year and a country (beforeAll)
      // WHEN listing the values of the year attribute
      // THEN only the year comes back
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${yearAttribute.id}/values`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual([{ id: yearValue.id, value: '1965' }])
        })
    })

    it('should update an attribute value', async () => {
      // GIVEN a year value of 1966
      const valueToUpdate = await createTestAttributeValue(app, testAuthToken, valueItem.id, yearAttribute.id, '1966')

      // WHEN it is changed to 1967
      // THEN the new value comes back on the same id
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/${valueToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ value: '1967', item: { id: valueItem.id }, attribute: { id: yearAttribute.id } })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as AttributeValueResponse
          expect(apiResult.id).toBe(valueToUpdate.id)
          expect(apiResult.value).toBe('1967')
        })
    })

    it('should fail to update a non-existent attribute value', async () => {
      // GIVEN no attribute value with id 999999
      // WHEN updating it
      // THEN it is not found
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ value: '1968', item: { id: valueItem.id }, attribute: { id: yearAttribute.id } })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute value not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })

    it('should delete an attribute value', async () => {
      // GIVEN a year value of 1969
      const valueToDelete = await createTestAttributeValue(app, testAuthToken, valueItem.id, yearAttribute.id, '1969')

      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/${valueToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/values/${valueToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })
  })

  describe('Attribute permissions for the user role', () => {
    let userToken: string

    beforeAll(async () => {
      userToken = await getUserRoleAuthToken(app)
    })

    it('should let users list attributes so they can propose category attributes', async () => {
      // GIVEN a user-role token (beforeAll)
      // WHEN listing attributes
      // THEN the request succeeds
      await request(app)
        .get(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    })

    it('should forbid users from creating attributes', async () => {
      // GIVEN a user-role token (beforeAll)
      // WHEN creating an attribute
      // THEN it is forbidden
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'User-Attribute', valueType: AttributeValueType.STRING })
        .expect(403)
        .expect(res => expect((res.body as APIError).code).toBe(ErrorCode.FORBIDDEN))
    })
  })
})
