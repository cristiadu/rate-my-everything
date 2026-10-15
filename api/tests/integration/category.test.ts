import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import Category from '@/models/Category'
import AttributeValueType from '@/models/AttributeValueType'
import Attribute from '@/models/Attribute'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { createTestCategory } from '@@/testutils/common/Categories'
import { Endpoints } from '@@/testutils/common/constants'

describe('Category API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`POST ${Endpoints.CATEGORIES_BASE_PATH}`, () => {
    it('should create a new category when authorized', async () => {
      // GIVEN a new category name and description
      // WHEN an admin creates it
      // THEN it comes back with an id and the sent fields
      await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Created-Category', description: 'Created during integration tests' })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe('Created-Category')
          expect(apiResult.description).toBe('Created during integration tests')
        })
    })

    it('should fail to create a category with missing name', async () => {
      // GIVEN a category without a name
      // WHEN an admin creates it
      // THEN the request fails validation
      await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required field: name')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should fail to create a category when unauthorized', async () => {
      // GIVEN no authorization header
      // WHEN creating a category
      // THEN the request is rejected as unauthorized
      await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', '')
        .send({ name: 'Unauthorized-Category', description: 'Should not be created' })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing or invalid authorization header')
          expect(apiError.code).toBe(ErrorCode.UNAUTHORIZED)
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe(`PUT ${Endpoints.CATEGORIES_BASE_PATH}/:name`, () => {
    let categoryToUpdate: Category

    beforeEach(async () => {
      categoryToUpdate = await createTestCategory(app, testAuthToken, `Update-Category-${Date.now()}`, 'Before the update')
    })

    it('should update a category', async () => {
      // GIVEN a category described as "Before the update" (beforeEach)
      // WHEN its description is updated
      // THEN the new description comes back on the same category
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${categoryToUpdate.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Updated category description' })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.description).toBe('Updated category description')
          expect(apiResult.name).toBe(categoryToUpdate.name)
          expect(apiResult.id).toBe(categoryToUpdate.id)
        })
    })

    it('should update same category with same name', async () => {
      // GIVEN a category described as "Before the update" (beforeEach)
      // WHEN it is updated with its own name
      // THEN it comes back unchanged
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${categoryToUpdate.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: categoryToUpdate.name })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.description).toBe('Before the update')
          expect(apiResult.name).toBe(categoryToUpdate.name)
          expect(apiResult.id).toBe(categoryToUpdate.id)
        })
    })

    it('should fail to update a non-existent category', async () => {
      // GIVEN no category named non-existent-category
      // WHEN updating it
      // THEN it is not found
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })

    it('should fail to update a category when unauthorized', async () => {
      // GIVEN an existing category (beforeEach) and no authorization header
      // WHEN updating it
      // THEN the request is rejected as unauthorized
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${categoryToUpdate.name}`)
        .set('Authorization', '')
        .send({ description: 'Unauthorized update attempt' })
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing or invalid authorization header')
          expect(apiError.code).toBe(ErrorCode.UNAUTHORIZED)
          expect(apiError.status).toBe(401)
        })
    })

    it('should fail when updating a category to a name that already exists', async () => {
      // GIVEN another category named Taken-Category
      await createTestCategory(app, testAuthToken, 'Taken-Category', 'Owns the name')

      // WHEN the first category is renamed to Taken-Category
      // THEN the rename is rejected
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${categoryToUpdate.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Taken-Category' })
        .expect('Content-Type', /json/)
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Resource "Category" with id "Taken-Category" already exists')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS)
          expect(apiError.status).toBe(422)
        })
    })
  })

  describe(`GET ${Endpoints.CATEGORIES_BASE_PATH}/:name`, () => {
    beforeAll(async () => {
      await createTestCategory(app, testAuthToken, 'Fetched-Category', 'Read by name')
    })

    it('should return a specific category by name', async () => {
      // GIVEN the category Fetched-Category (beforeAll)
      // WHEN getting it by name
      // THEN its fields come back
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/Fetched-Category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.id).toBeDefined()
          expect(apiResult.name).toBe('Fetched-Category')
          expect(apiResult.description).toBe('Read by name')
        })
    })

    it('should fail to get a non-existent category', async () => {
      // GIVEN no category named non-existent-category
      // WHEN getting it by name
      // THEN it is not found
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Category not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })

    it('should fail to get a category when unauthorized', async () => {
      // GIVEN the category Fetched-Category (beforeAll) and no authorization header
      // WHEN getting it by name
      // THEN the request is rejected as unauthorized
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/Fetched-Category`)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing or invalid authorization header')
          expect(apiError.code).toBe(ErrorCode.UNAUTHORIZED)
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe(`GET ${Endpoints.CATEGORIES_BASE_PATH}`, () => {
    beforeAll(async () => {
      await cleanupAllCategories(app)
      await createTestCategory(app, testAuthToken, 'Listed-Category-A', 'First listed')
      await createTestCategory(app, testAuthToken, 'Listed-Category-B', 'Second listed')
    })

    it('should return all categories', async () => {
      // GIVEN exactly the categories Listed-Category-A and Listed-Category-B (beforeAll)
      // WHEN listing categories
      // THEN both come back
      await request(app)
        .get(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const categories = res.body as Category[]
          expect(categories.map((category) => [category.name, category.description]).sort()).toEqual([
            ['Listed-Category-A', 'First listed'],
            ['Listed-Category-B', 'Second listed'],
          ])
        })
    })

    it('should fail to get categories when unauthorized', async () => {
      // GIVEN no authorization header
      // WHEN listing categories
      // THEN the request is rejected as unauthorized
      await request(app)
        .get(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing or invalid authorization header')
          expect(apiError.code).toBe(ErrorCode.UNAUTHORIZED)
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe(`GET ${Endpoints.CATEGORIES_BASE_PATH} with no categories`, () => {
    beforeAll(async () => {
      await cleanupAllCategories(app)
    })

    it('should return an empty array when no categories exist', async () => {
      // GIVEN no categories (beforeAll)
      // WHEN listing categories
      // THEN the list is empty
      await request(app)
        .get(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => { expect(res.body).toEqual([]) })
    })
  })

  describe(`DELETE ${Endpoints.CATEGORIES_BASE_PATH}/:name`, () => {
    beforeAll(async () => {
      await createTestCategory(app, testAuthToken, 'Delete-Category', 'Deleted during tests')
    })

    it('should delete a category', async () => {
      // GIVEN the category Delete-Category (beforeAll)
      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.CATEGORIES_BASE_PATH}/Delete-Category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/Delete-Category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })

    it('should not fail when deleting a non-existent category', async () => {
      // GIVEN no category named non-existent-category
      // WHEN deleting it
      // THEN the delete still succeeds with no body
      await request(app)
        .delete(`${Endpoints.CATEGORIES_BASE_PATH}/non-existent-category`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => expect(res.text).toBe(''))
    })

    it('should fail to delete a category when unauthorized', async () => {
      // GIVEN no authorization header
      // WHEN deleting a category
      // THEN the request is rejected as unauthorized
      await request(app)
        .delete(`${Endpoints.CATEGORIES_BASE_PATH}/Delete-Category`)
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing or invalid authorization header')
          expect(apiError.code).toBe(ErrorCode.UNAUTHORIZED)
          expect(apiError.status).toBe(401)
        })
    })
  })

  describe('Category attributes', () => {
    let linkedAttribute: Attribute
    let linkedCategory: Category

    beforeAll(async () => {
      const attributeRes = await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: `Linked-Attribute-${Date.now()}`, valueType: AttributeValueType.STRING })
        .expect(201)
      linkedAttribute = attributeRes.body as Attribute
    })

    beforeEach(async () => {
      const categoryRes = await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: `Linked-Category-${Date.now()}`, attributeIds: [linkedAttribute.id] })
        .expect(201)
      linkedCategory = categoryRes.body as Category
    })

    afterAll(async () => {
      await cleanupAllCategories(app)
      await request(app)
        .delete(`${Endpoints.ATTRIBUTES_BASE_PATH}/${linkedAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
    })

    it('should create a category linked to attributes', async () => {
      // GIVEN an existing attribute (beforeAll)
      // WHEN creating a category that references it
      // THEN the category comes back with that attribute linked
      await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'New-Linked-Category', attributeIds: [linkedAttribute.id] })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.attributes.map(attr => attr.id)).toEqual([linkedAttribute.id])
        })
    })

    it('should return linked attributes when getting a category', async () => {
      // GIVEN a category linked to the attribute (beforeEach)
      // WHEN getting it by name
      // THEN its attributes are included
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/${linkedCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.attributes.map(attr => attr.name)).toEqual([linkedAttribute.name])
        })
    })

    it('should keep linked attributes when attributeIds is omitted on update', async () => {
      // GIVEN a category linked to the attribute (beforeEach)
      // WHEN updating it without attributeIds
      // THEN its attributes stay linked
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${linkedCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Still linked' })
        .expect(200)
        .expect(res => {
          const apiResult = res.body as Category
          expect(apiResult.attributes.map(attr => attr.id)).toEqual([linkedAttribute.id])
        })
    })

    it('should unlink attributes when updating with an empty list', async () => {
      // GIVEN a category linked to the attribute (beforeEach)
      // WHEN updating it with an empty attributeIds list
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${linkedCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeIds: [] })
        .expect(200)

      // THEN it has no attributes
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/${linkedCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => expect((res.body as Category).attributes).toEqual([]))
    })

    it('should reject attributeIds that are not integers', async () => {
      // GIVEN a category linked to the attribute (beforeEach)
      // WHEN updating it with non-integer attributeIds
      // THEN the request is rejected as invalid
      await request(app)
        .put(`${Endpoints.CATEGORIES_BASE_PATH}/${linkedCategory.name}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeIds: ['abc'] })
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toContain('"attributeIds.$0":{"message":"invalid float number"')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should reject attribute ids that do not exist', async () => {
      // GIVEN no attribute with id 999999
      // WHEN creating a category that references it
      // THEN the request is rejected naming the unknown id
      await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: `Unknown-Attr-Category-${Date.now()}`, attributeIds: [999999] })
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Unknown attribute ids: 999999')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })
  })

  describe('Category permissions for the user role', () => {
    let userToken: string

    beforeAll(async () => {
      userToken = await getUserRoleAuthToken(app)
    })

    it('should let users list categories', async () => {
      // GIVEN a user-role token (beforeAll)
      // WHEN listing categories
      // THEN the request succeeds
      await request(app)
        .get(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    })

    it.each([
      ['POST', () => request(app).post(Endpoints.CATEGORIES_BASE_PATH).send({ name: 'User-Category' })],
      ['PUT', () => request(app).put(`${Endpoints.CATEGORIES_BASE_PATH}/any-category`).send({ description: 'Nope' })],
      ['DELETE', () => request(app).delete(`${Endpoints.CATEGORIES_BASE_PATH}/any-category`)],
    ])('should forbid users from %s on categories', async (_method, buildRequest) => {
      // GIVEN a user-role token (beforeAll)
      // WHEN calling a write endpoint
      // THEN it is forbidden
      await buildRequest()
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(403)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.code).toBe(ErrorCode.FORBIDDEN)
          expect(apiError.status).toBe(403)
        })
    })
  })

  describe(`GET ${Endpoints.CATEGORIES_BASE_PATH}/similar`, () => {
    beforeAll(async () => {
      await cleanupAllCategories(app)
      for (const name of ['Board Games', 'Podcasts']) {
        await request(app)
          .post(Endpoints.CATEGORIES_BASE_PATH)
          .set('Authorization', `Bearer ${testAuthToken}`)
          .send({ name })
          .expect(201)
      }
    })

    it('should return the categories whose name is likely a duplicate', async () => {
      // GIVEN the categories Board Games and Podcasts (beforeAll)
      // WHEN categories similar to "boardgame" are requested
      // THEN only Board Games is returned, with its attributes
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/similar`)
        .query({ name: 'boardgame' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const categories = res.body as Category[]
          expect(categories.map((category) => [category.name, category.attributes])).toEqual([['Board Games', []]])
        })
    })

    it('should return an empty list when no category name is similar', async () => {
      // GIVEN the categories Board Games and Podcasts (beforeAll)
      // WHEN categories similar to an unrelated name are requested
      // THEN none are returned
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/similar`)
        .query({ name: 'Movies' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => { expect(res.body).toEqual([]) })
    })

    it('should reject a missing name', async () => {
      // GIVEN the categories Board Games and Podcasts (beforeAll)
      // WHEN similar categories are requested without a name
      // THEN the request fails validation
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/similar`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe("Invalid request: name: 'name' is required")
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })
  })
})
