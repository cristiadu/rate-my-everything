import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Item from '@/models/Item'
import Category from '@/models/Category'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllItems, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { createTestAttribute } from '@@/testutils/common/Attributes'
import { createTestItemInCategory } from '@@/testutils/common/Items'
import { Endpoints } from '@@/testutils/common/constants'

describe('Item API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testCategory: Category
  let pagesAttribute: Attribute
  let unlinkedAttribute: Attribute

  beforeAll(async () => {
    await cleanupAllCategories(app)

    pagesAttribute = await createTestAttribute(app, testAuthToken, `Pages-${Date.now()}`, AttributeValueType.NUMBER)
    unlinkedAttribute = await createTestAttribute(app, testAuthToken, `Unlinked-${Date.now()}`, AttributeValueType.STRING)

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({ name: 'Item-Category', description: 'For item tests', attributeIds: [pagesAttribute.id] })
      .expect(201)
    testCategory = categoryRes.body
  })

  describe(`POST ${Endpoints.ITEMS_BASE_PATH}`, () => {
    it('should create a new item with its attribute values', async () => {
      // GIVEN an item in the test category with a value for its Pages attribute
      const newItem = {
        name: 'Created-Item',
        description: 'Item for integration test',
        imageUrl: 'https://example.com/book.png',
        categoryId: testCategory.id,
        attributeValues: [{ attributeId: pagesAttribute.id, value: '320' }],
      }

      // WHEN it is created THEN the response carries its category and attribute values
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const apiResult = res.body as Item
          expect(apiResult.id).toBeDefined()
          expect(apiResult.category.name).toBe('Item-Category')
          expect(apiResult.name).toBe('Created-Item')
          expect(apiResult.description).toBe('Item for integration test')
          expect(apiResult.imageUrl).toBe('https://example.com/book.png')
          expect(apiResult.attributes.map((value) => [value.attribute.id, value.value])).toEqual([[pagesAttribute.id, '320']])
        })
    })

    it('should fail to create an item with missing name', async () => {
      // GIVEN an item without a name
      // WHEN it is created
      // THEN the request fails validation
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Missing name', categoryId: testCategory.id })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: name, categoryId')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })

    it('should reject a value for an attribute outside the item category', async () => {
      // GIVEN an item with a value for an attribute its category does not use
      const newItem = {
        name: `Wrong-Attribute-${Date.now()}`,
        description: 'Uses an unlinked attribute',
        categoryId: testCategory.id,
        attributeValues: [{ attributeId: unlinkedAttribute.id, value: 'nope' }],
      }

      // WHEN it is created THEN the API refuses it as an unknown attribute
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send(newItem)
        .expect('Content-Type', /json/)
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe(`Unknown attribute ids: ${unlinkedAttribute.id}`)
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should reject a category that does not exist', async () => {
      // GIVEN no category with id 999999
      // WHEN an item is created in it
      // THEN the API refuses it as an unknown category
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'No category', description: 'Missing category', categoryId: 999999 })
        .expect('Content-Type', /json/)
        .expect(422)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Unknown category id: 999999')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })
  })

  describe(`GET ${Endpoints.ITEMS_BASE_PATH}`, () => {
    beforeAll(async () => {
      await cleanupAllItems(app)
      await createTestItemInCategory(app, testAuthToken, testCategory.id, 'Listed-Item', 'Listed in tests')
    })

    it('should get all items', async () => {
      // GIVEN exactly the item Listed-Item (beforeAll)
      // WHEN listing items
      // THEN only it comes back, with its category
      await request(app)
        .get(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const items = res.body as Item[]
          expect(items.map((item) => [item.name, item.description, item.category.name]))
            .toEqual([['Listed-Item', 'Listed in tests', 'Item-Category']])
        })
    })
  })

  describe(`GET ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    let fetchedItem: Item

    beforeAll(async () => {
      fetchedItem = await createTestItemInCategory(
        app, testAuthToken, testCategory.id, 'Fetched-Item', 'Read by id', [{ attributeId: pagesAttribute.id, value: '320' }],
      )
    })

    it('should get item by id', async () => {
      // GIVEN the item Fetched-Item with 320 pages (beforeAll)
      // WHEN getting it by id
      // THEN its fields, category and attribute values come back
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/${fetchedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item.id).toBe(fetchedItem.id)
          expect(item.name).toBe('Fetched-Item')
          expect(item.description).toBe('Read by id')
          expect(item.category.name).toBe('Item-Category')
          expect(item.attributes.map((value) => value.value)).toEqual(['320'])
        })
    })

    it('should fail to get a non-existent item', async () => {
      // GIVEN no item with id 999999
      // WHEN getting it by id
      // THEN it is not found
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`PUT ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    let itemToUpdate: Item

    beforeEach(async () => {
      itemToUpdate = await createTestItemInCategory(
        app, testAuthToken, testCategory.id, `Update-Item-${Date.now()}`, 'Before the update',
        [{ attributeId: pagesAttribute.id, value: '320' }],
      )
    })

    it('should update an item', async () => {
      // GIVEN an item with 320 pages (beforeEach)
      // WHEN its description is updated
      // THEN the new description comes back and its name, category and values stay the same
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${itemToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Updated item description' })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const item = res.body as Item
          expect(item.description).toBe('Updated item description')
          expect(item.name).toBe(itemToUpdate.name)
          expect(item.category.name).toBe('Item-Category')
          expect(item.attributes.map((value) => value.value)).toEqual(['320'])
        })
    })

    it('should replace attribute values in place when new ones are sent', async () => {
      // GIVEN an item with 320 pages (beforeEach)
      const [currentValue] = itemToUpdate.attributes

      // WHEN a new Pages value is sent
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${itemToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeValues: [{ attributeId: pagesAttribute.id, value: '412' }] })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          // THEN the same value row now holds the new value
          const item = res.body as Item
          expect(item.attributes.map((value) => [value.id, value.value])).toEqual([[currentValue.id, '412']])
        })
    })

    it('should remove attribute values that are left out', async () => {
      // GIVEN an item with 320 pages (beforeEach)
      // WHEN it is updated with no attribute values
      // THEN it has none left
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/${itemToUpdate.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ attributeValues: [] })
        .expect(200)
        .expect(res => expect((res.body as Item).attributes).toEqual([]))
    })

    it('should fail to update a non-existent item', async () => {
      // GIVEN no item with id 999999
      // WHEN updating it
      // THEN it is not found
      await request(app)
        .put(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ description: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe('Item permissions for the user role', () => {
    let userToken: string
    let sharedItem: Item

    beforeAll(async () => {
      userToken = await getUserRoleAuthToken(app)
      sharedItem = await createTestItemInCategory(app, testAuthToken, testCategory.id, 'Shared-Item', 'Changed only by moderators')
    })

    it.each([
      ['PUT', () => request(app).put(`${Endpoints.ITEMS_BASE_PATH}/${sharedItem.id}`).send({ description: 'Nope' })],
      ['DELETE', () => request(app).delete(`${Endpoints.ITEMS_BASE_PATH}/${sharedItem.id}`)],
    ])('should forbid users from %s on an item and point them to change requests', async (_method, buildRequest) => {
      // GIVEN a user-role token and a shared item (beforeAll)
      // WHEN changing a shared item directly
      // THEN it is forbidden
      await buildRequest()
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.code).toBe(ErrorCode.FORBIDDEN)
          expect(apiError.message).toBe('Only moderators can change interests directly; send a change request instead')
        })
    })
  })

  describe(`DELETE ${Endpoints.ITEMS_BASE_PATH}/:id`, () => {
    it('should delete an item', async () => {
      // GIVEN an item in the test category
      const itemToDelete = await createTestItemInCategory(app, testAuthToken, testCategory.id, 'Delete-Item', 'Deleted during tests')

      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.ITEMS_BASE_PATH}/${itemToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/${itemToDelete.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })

    it('should not fail when deleting a non-existent item', async () => {
      // GIVEN no item with id 999999
      // WHEN deleting it
      // THEN the delete still succeeds with no body
      await request(app)
        .delete(`${Endpoints.ITEMS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.text).toBe('') })
    })
  })

  describe(`GET ${Endpoints.ITEMS_BASE_PATH}/similar`, () => {
    let otherCategory: Category
    let ringsItem: Item

    beforeAll(async () => {
      const otherCategoryRes = await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: `OtherItemCat-${Date.now()}` })
        .expect(201)
      otherCategory = otherCategoryRes.body

      const itemsToCreate = [
        { name: 'The Lord of the Rings', categoryId: testCategory.id },
        { name: 'Dune', categoryId: testCategory.id },
        { name: 'Pokémon Red', categoryId: testCategory.id },
        { name: 'Lord of the Rings', categoryId: otherCategory.id },
      ]
      const createdItems: Item[] = []
      for (const item of itemsToCreate) {
        const itemRes = await request(app)
          .post(Endpoints.ITEMS_BASE_PATH)
          .set('Authorization', `Bearer ${testAuthToken}`)
          .send({ ...item, description: 'Item for duplicate detection tests' })
          .expect(201)
        createdItems.push(itemRes.body)
      }
      ringsItem = createdItems[0]
    })

    it('should return only the items in the category whose name is likely a duplicate', async () => {
      // GIVEN "The Lord of the Rings", "Dune" and "Pokémon Red" in the test category and "Lord of the Rings" in another one (beforeAll)
      // WHEN items similar to a misspelled name are requested for the test category
      // THEN only the matching item of that category is returned, with its category and attribute values
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/similar`)
        .query({ name: 'lord of the ring', categoryId: testCategory.id })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const items = res.body as Item[]
          expect(items.map((item) => [item.id, item.name, item.category.id, item.attributes]))
            .toEqual([[ringsItem.id, 'The Lord of the Rings', testCategory.id, []]])
        })
    })

    it('should ignore accents and case', async () => {
      // GIVEN "Pokémon Red" in the test category (beforeAll)
      // WHEN items similar to the name without its accent are requested
      // THEN Pokémon Red is returned
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/similar`)
        .query({ name: 'POKEMON RED' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => {
          expect((res.body as Item[]).map((item) => item.name)).toEqual(['Pokémon Red'])
        })
    })

    it('should search every category when no categoryId is sent', async () => {
      // GIVEN the items created in beforeAll
      // WHEN items similar to "Lord of the Rings!" are requested without a category
      // THEN both equally similar matches are returned, the oldest first
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/similar`)
        .query({ name: 'Lord of the Rings!' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => {
          const items = res.body as Item[]
          expect(items.map((item) => item.name)).toEqual(['The Lord of the Rings', 'Lord of the Rings'])
          expect(items.map((item) => item.category.id).sort()).toEqual([testCategory.id, otherCategory.id].sort())
        })
    })

    it('should return an empty list when no item name is similar', async () => {
      // GIVEN the items created in beforeAll
      // WHEN items similar to an unrelated name are requested
      // THEN none are returned
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/similar`)
        .query({ name: 'Hyperion' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => { expect(res.body).toEqual([]) })
    })

    it.each([
      [{}, "Invalid request: name: 'name' is required"],
      [{ name: '  ' }, 'Invalid value for name: it must be a non-empty text'],
      [{ name: 'Dune', categoryId: 'books' }, 'Invalid request: categoryId: invalid float number'],
    ])('should reject the query %j', async (query, message) => {
      // GIVEN the items created in beforeAll
      // WHEN the name is missing or blank, or the category is not a number
      // THEN the request fails validation
      await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/similar`)
        .query(query)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe(message)
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })
  })
})
