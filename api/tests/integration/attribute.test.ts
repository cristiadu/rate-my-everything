import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import Category from '@/models/Category'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllAttributes, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { Endpoints } from '@@/testutils/common/constants'

describe('Attribute API Integration Tests', async () => {
  const testAuthToken = await getAuthTokenFromFile()
  const app = await appReady
  let testCategory: Category
  let testAttribute: Attribute

  beforeAll(async () => {
    await cleanupAllAttributes(app)
    await cleanupAllCategories(app)

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `AttrCat-${Date.now()}`, description: 'For attribute tests' })
    if (categoryRes.status !== 201) {
      throw new Error(`Failed to create test category: ${categoryRes.status} ${JSON.stringify(categoryRes.body)}`)
    }
    testCategory = categoryRes.body
  })

  beforeEach(() => {
    if (!testCategory) {
      throw new Error('Test category not initialized')
    }
  })

  describe(`POST ${Endpoints.ATTRIBUTES_BASE_PATH}`, () => {
    it('should create a new attribute', async () => {
      const newAttribute = {
        name: `Test-Attribute-${Date.now()}`,
        description: 'Attribute for integration test',
        valueType: AttributeValueType.STRING,
        values: ['Value1', 'Value2'],
        categoryId: testCategory.id
      }

      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newAttribute)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Attribute
          //const categoriesNames = apiResult.categories?.map(cat => cat.name) ?? []
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe(newAttribute.name)
          expect(apiResult.valueType).toBe(newAttribute.valueType)
          //expect(categoriesNames).toContain(testCategory.name)
          //expect(apiResult.values).toBe(newAttribute.values)
          testAttribute = apiResult
        })

      if (!testAttribute) {
        throw new Error('testAttribute was not set properly')
      }
    })

    it('should fail to create an attribute with missing name', async () => {
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name', categoryId: testCategory.id })
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
      expect(apiError.message).toBe(`valueType must be one of: ${Object.values(AttributeValueType).join(', ')}`)
    })
  })

  describe(`GET ${Endpoints.ATTRIBUTES_BASE_PATH}`, () => {
    it('should get all attributes', async () => {
      if (!testAttribute) {
        throw new Error('testAttribute not initialized')
      }

      await request(app)
        .get(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBe(1)

          const apiResult = res.body as Attribute[]
          let foundExpected = false
          for (const attr of apiResult) {
            if (attr.id === testAttribute.id) {
              expect(attr.id).toBe(testAttribute.id)
              expect(attr.name).toBe(testAttribute.name)
              //expect(attr.categories?.map(cat => cat.name) ?? []).toContain(testCategory.name)
              expect(attr.valueType).toBe(testAttribute.valueType)
              //expect(attr.values).toEqual(testAttribute.values)
              foundExpected = true
            } else {
              expect(attr.id).toBeDefined()
              expect(attr.name).toBeDefined()
              expect(attr.categories).toBeDefined()
              expect(attr.valueType).toBeDefined()
              expect(attr.values).toBeDefined()
            }
          }

          expect(foundExpected).toBe(true)
        })
    })
  })

  describe(`GET ${Endpoints.ATTRIBUTES_BASE_PATH}/:id`, () => {
    it('should get attribute by id', async () => {
      if (!testAttribute) {
        throw new Error('testAttribute not initialized')
      }

      await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          //const categoriesNames = apiResult.categories.map(cat => cat.name)
          expect(apiResult.id).toBe(testAttribute.id)
          expect(apiResult.name).toBe(testAttribute.name)
          expect(apiResult.valueType).toBe(testAttribute.valueType)
          //expect(categoriesNames).toContain(testCategory.name)
          //expect(apiResult.values).toEqual(testAttribute.values)
        })
    })

    it('should fail to get a non-existent attribute', async () => {
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
    it('should update an attribute', async () => {
      if (!testAttribute) {
        throw new Error('testAttribute not initialized')
      }

      const updatedValues = ['Updated value 1', 'Updated value 2']
      const updatedName = 'Updated name'
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ values: updatedValues, name: updatedName })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          //const categoriesNames = apiResult.categories.map(cat => cat.name)
          expect(apiResult.id).toBe(testAttribute.id)
          expect(apiResult.name).toBe(updatedName)
          expect(apiResult.valueType).toBe(testAttribute.valueType)
          //expect(categoriesNames).toContain(testCategory.name)
          //expect(apiResult.values).toEqual(updatedValues)
        })
    })

    it('should fail to update an attribute to an unknown value type', async () => {
      // GIVEN an existing attribute
      if (!testAttribute) {
        throw new Error('testAttribute not initialized')
      }

      // WHEN changing its value type to one outside AttributeValueType
      const res = await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ valueType: 'colour' })

      // THEN it is rejected and the attribute keeps its value type
      expect(res.status).toBe(400)
      expect((res.body as APIError).code).toBe(ErrorCode.VALIDATION_ERROR)
      const current = await request(app)
        .get(`${Endpoints.ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
      expect((current.body as Attribute).valueType).toBe(testAttribute.valueType)
    })

    it('should fail to update a non-existent attribute', async () => {
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
      if (!testAttribute) {
        throw new Error('testAttribute not initialized')
      }

      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent attribute', async () => {
      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.body).toEqual({}) })
    })
  })
})
