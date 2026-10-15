import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllAttributes } from '@@/testutils/common/DataCleanup'
import { createTestAttribute } from '@@/testutils/common/Attributes'
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
