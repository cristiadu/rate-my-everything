import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import type Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import type Category from '@/models/Category'
import type APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import CategoryService from '@/services/CategoryService'
import { createTestAttribute } from '@@/testutils/common/Attributes'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { createTestCategory } from '@@/testutils/common/Categories'
import { Endpoints } from '@@/testutils/common/constants'

describe('Category API error responses', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let existingCategory: Category
  let existingAttribute: Attribute

  beforeAll(async () => {
    existingAttribute = await createTestAttribute(app, testAuthToken, `Error-Attribute-${Date.now()}`, AttributeValueType.STRING)
    existingCategory = await createTestCategory(app, testAuthToken, `Error-Category-${Date.now()}`, 'For error tests')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await request(app)
      .delete(`${Endpoints.CATEGORIES_BASE_PATH}/${existingCategory.name}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
    await request(app)
      .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/${existingAttribute.id}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(204)
  })

  it('should reject a similar-name search for a name made only of spaces', async () => {
    // GIVEN a name of only spaces
    // WHEN similar categories are requested for it
    // THEN the request fails validation
    await request(app)
      .get(`${Endpoints.CATEGORIES_BASE_PATH}/similar`)
      .query({ name: '   ' })
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        const apiError = res.body as APIError
        expect(apiError.message).toBe('Invalid value for name: it must be a non-empty text')
        expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      })
  })

  it('should reject linking an attribute id that does not exist on update, naming only that id', async () => {
    // GIVEN an existing category and attribute (beforeAll) and no attribute with id 999999
    // WHEN updating the category to link the existing attribute and attribute 999999
    // THEN the request is rejected naming only the unknown id
    await request(app)
      .put(`${Endpoints.CATEGORIES_BASE_PATH}/${existingCategory.name}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ attributeIds: [existingAttribute.id, 999999] })
      .expect('Content-Type', /json/)
      .expect(422)
      .expect(res => {
        const apiError = res.body as APIError
        expect(apiError.message).toBe('Unknown attribute ids: 999999')
        expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(apiError.status).toBe(422)
      })
  })

  it('should answer with an internal error when saving the category fails unexpectedly', async () => {
    // GIVEN saving categories fails with an unexpected error
    vi.spyOn(CategoryService.prototype, 'create').mockRejectedValueOnce(new Error('Connection terminated unexpectedly'))

    // WHEN an admin creates a category
    // THEN an internal error comes back without the error's details
    await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: 'Unsaved-Category' })
      .expect('Content-Type', /json/)
      .expect(500)
      .expect(res => {
        expect(res.body).toEqual({ code: ErrorCode.INTERNAL_ERROR, status: 500, message: 'An internal server error occurred' })
      })
  })
})
