import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { CATEGORIES_BASE_PATH } from '@@/testutils/integration/category.test'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import Category from '@/models/Category'
import { cleanupAllAttributes, cleanupAllCategories } from '@@/testutils/common/DataCleanup'

export const ATTRIBUTES_BASE_PATH = '/api/attributes'

describe('Attribute API Integration Tests', async () => {
  const app = await appReady
  let testCategory: Category
  let testAttribute: Attribute

  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    await cleanupAllAttributes(app)
    await cleanupAllCategories(app)
    
    // Create a category for attribute association
    const categoryRes = await request(app)
      .post(CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: `AttrCat-${Date.now()}`, description: 'For attribute tests' })
      .expect(201)
    testCategory = categoryRes.body
  })

  describe(`POST ${ATTRIBUTES_BASE_PATH}`, () => {
    it('should create a new attribute', async () => {
      const newAttribute = {
        name: `Test-Attribute-${Date.now()}`,
        description: 'Attribute for integration test',
        valueType: 'string',
        values: ['Value1', 'Value2'],
        categoryId: testCategory.id
      }

      await request(app)
        .post(ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newAttribute)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe(newAttribute.name)
          expect(apiResult.valueType).toBe(newAttribute.valueType)
          expect(apiResult.categories).toContain(testCategory.id)
          expect(apiResult.values).toBe(newAttribute.values)
          testAttribute = apiResult
        })
    })

    it('should fail to create an attribute with missing name', async () => {
      await request(app)
        .post(ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name', categoryId: testCategory.id })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Name is required')
          expect(apiError.code).toBe('Bad Request')
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`GET ${ATTRIBUTES_BASE_PATH}`, () => {
    it('should get all attributes', async () => {
      await request(app)
        .get(ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBeGreaterThan(0)

          const apiResult = res.body as Attribute[]
          let foundExpected = false
          for (const attr of apiResult) {
            if (attr.id === testAttribute.id) {
              expect(attr.id).toBe(testAttribute.id)
              expect(attr.name).toBe(testAttribute.name)
              expect(attr.categories).toContain(testCategory.id)
              expect(attr.valueType).toBe(testAttribute.valueType)
              expect(attr.values).toEqual(testAttribute.values)
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

  describe(`GET ${ATTRIBUTES_BASE_PATH}/:id`, () => {
    it('should get attribute by id', async () => {
      await request(app)
        .get(`${ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBe(testAttribute.id)
          expect(apiResult.name).toBe(testAttribute.name)
          expect(apiResult.valueType).toBe(testAttribute.valueType)
          expect(apiResult.categories).toContain(testCategory.id)
          expect(apiResult.values).toEqual(testAttribute.values)
        })
    })

    it('should fail to get a non-existent attribute', async () => {
      await request(app)
        .get(`${ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`PUT ${ATTRIBUTES_BASE_PATH}/:id`, () => {
    it('should update an attribute', async () => {
      const updatedValues = ['Updated value 1', 'Updated value 2']
      await request(app)
        .put(`${ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ values: updatedValues })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Attribute
          expect(apiResult.id).toBe(testAttribute.id)
          expect(apiResult.name).toBe(testAttribute.name)
          expect(apiResult.valueType).toBe(testAttribute.valueType)
          expect(apiResult.categories).toContain(testCategory.id)
          expect(apiResult.values).toEqual(updatedValues)
        })
    })

    it('should fail to update a non-existent attribute', async () => {
      await request(app)
        .put(`${ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`DELETE ${ATTRIBUTES_BASE_PATH}/:id`, () => {
    it('should delete an attribute', async () => {
      await request(app)
        .delete(`${ATTRIBUTES_BASE_PATH}/${testAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should fail to delete a non-existent attribute', async () => {
      await request(app)
        .delete(`${ATTRIBUTES_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Attribute not found')
          expect(apiError.code).toBe('RESOURCE_NOT_FOUND')
          expect(apiError.status).toBe(404)
        })
    })
  })
})
