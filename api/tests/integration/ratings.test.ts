import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import Item from '@/models/Item'
import RatedItem from '@/models/RatedItem'
import Category from '@/models/Category'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import RankingScope from '@/models/RankingScope'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories, cleanupAllRatedItems } from '@@/testutils/common/DataCleanup'
import { createTestItem, createTestItemInCategory } from '@@/testutils/common/Items'
import { createTestCategory } from '@@/testutils/common/Categories'
import { createTestAttribute } from '@@/testutils/common/Attributes'
import { createTestRating } from '@@/testutils/common/Ratings'
import { Endpoints } from '@@/testutils/common/constants'

describe('RatedItem API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let testItem: Item

  beforeAll(async () => {
    await cleanupAllCategories(app)
    testItem = await createTestItem(app, testAuthToken, 'Rated')
  })

  beforeEach(async () => {
    await cleanupAllRatedItems(app)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
  })

  describe(`POST ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should create a new rated item for the signed-in user', async () => {
      // GIVEN the test item (beforeAll)
      // WHEN the admin rates it 5 with a note
      // THEN the rating comes back with its item, category, note and grade
      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ item_id: testItem.id, rating: 5.00, notes: 'Excellent!' })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(res => {
          const ratedItem = res.body as RatedItem
          expect(ratedItem.id).toBeDefined()
          expect(ratedItem.item.name).toBe(testItem.name)
          expect(ratedItem.item.category.name).toBe(testItem.category.name)
          expect(ratedItem.notes).toBe('Excellent!')
          expect(ratedItem.rating).toBe(5)
        })
    })

    it('should fail to create a rated item with missing itemId', async () => {
      // GIVEN a rating without an item_id
      // WHEN it is posted
      // THEN the request fails validation
      await request(app)
        .post(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ rating: 5, comment: 'Missing itemId' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Missing required fields: item_id, rating')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.status).toBe(400)
        })
    })
  })

  describe(`PUT ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should update a rated item', async () => {
      // GIVEN a 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN its note is updated
      // THEN the new note comes back and the grade and item stay the same
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ notes: 'Updated comment' } as Partial<RatedItem>)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const updatedRatedItem = res.body as RatedItem
          expect(updatedRatedItem.notes).toBe('Updated comment')
          expect(updatedRatedItem.id).toBe(ratedItem.id)
          expect(updatedRatedItem.rating).toBe(5)
          expect(updatedRatedItem.item.id).toBe(testItem.id)
        })
    })

    it('should fail to update a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN updating it
      // THEN it is not found
      await request(app)
        .put(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ comment: 'Should not work' })
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should get all rated items', async () => {
      // GIVEN one 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN all ratings are listed
      // THEN only that rating comes back
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const ratedItems = res.body as RatedItem[]
          expect(ratedItems).toHaveLength(1)
          expect(ratedItems[0].id).toBe(ratedItem.id)
          expect(ratedItems[0].notes).toBe('Excellent!')
          expect(ratedItems[0].rating).toBe(5)
          expect(ratedItems[0].item.name).toBe(testItem.name)
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/mine`, () => {
    it('should list only the ratings of the signed-in user', async () => {
      // GIVEN the admin rated the test item and another user rated nothing
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5)
      const otherUserToken = await getUserRoleAuthToken(app)

      // WHEN each user lists their own ratings
      const adminRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
      const otherUserRes = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/mine`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)

      // THEN only the admin sees the test rating
      expect((adminRes.body as RatedItem[]).map((rating) => rating.id)).toEqual([ratedItem.id])
      expect(otherUserRes.body).toEqual([])
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/:id`, () => {
    it('should get rated item by id', async () => {
      // GIVEN a 5 rating of the test item noted "Excellent!"
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5, 'Excellent!')

      // WHEN getting it by id
      // THEN its fields come back
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const fetchedRatedItem = res.body as RatedItem
          expect(fetchedRatedItem.notes).toBe('Excellent!')
          expect(fetchedRatedItem.id).toBe(ratedItem.id)
          expect(fetchedRatedItem.rating).toBe(5)
          expect(fetchedRatedItem.item.name).toBe(testItem.name)
        })
    })

    it('should fail to get a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN getting it by id
      // THEN it is not found
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Rated item not found')
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.status).toBe(404)
        })
    })
  })

  describe(`GET ${Endpoints.RATINGS_BASE_PATH}/item/:item_id`, () => {
    it('should list every rating of the item, keeping each time a user rated it', async () => {
      // GIVEN the admin rated the test item 5 and another user rated it 6 and then 8
      const adminRating = await createTestRating(app, testAuthToken, testItem.id, 5)
      const otherUserToken = await getUserRoleAuthToken(app)
      await createTestRating(app, otherUserToken, testItem.id, 6)
      await createTestRating(app, otherUserToken, testItem.id, 8)

      // WHEN the item's ratings are listed
      const res = await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/${testItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect('Content-Type', /json/)
        .expect(200)

      // THEN the admin's rating and both of the other user's ratings come back, each with its rater and date
      const ratedItems = (res.body as RatedItem[]).sort((a, b) => a.id - b.id)
      expect(ratedItems.map((ratedItem) => ratedItem.rating)).toEqual([5, 6, 8])
      expect(ratedItems[0].userId).toBe(adminRating.userId)
      expect(ratedItems[1].userId).not.toBe(adminRating.userId)
      expect(ratedItems[2].userId).toBe(ratedItems[1].userId)
      expect(Number.isNaN(Date.parse(String(ratedItems[2].ratedAt)))).toBe(false)
    })

    it('should return no ratings for an item nobody rated', async () => {
      // GIVEN an item id nobody rated
      // WHEN its ratings are listed
      // THEN the list is empty
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/item/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => { expect(res.body).toEqual([]) })
    })
  })

  describe(`DELETE ${Endpoints.RATINGS_BASE_PATH}`, () => {
    it('should delete a rated item', async () => {
      // GIVEN a rating of the test item
      const ratedItem = await createTestRating(app, testAuthToken, testItem.id, 5)

      // WHEN deleting it
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)

      // THEN it is gone
      await request(app)
        .get(`${Endpoints.RATINGS_BASE_PATH}/${ratedItem.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
    })

    it('should not fail when deleting a non-existent rated item', async () => {
      // GIVEN no rating with id 999999
      // WHEN deleting it
      // THEN the delete still succeeds with no body
      await request(app)
        .delete(`${Endpoints.RATINGS_BASE_PATH}/999999`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(204)
        .expect(res => { expect(res.body).toEqual({}) })
    })
  })
})

describe(`GET ${Endpoints.RATINGS_BASE_PATH} with filters`, async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let otherUserToken: string
  let books: Category
  let authorAttribute: Attribute
  let pagesAttribute: Attribute

  /** Lists the ratings matching the query string as the admin, and returns the rated item names with their grades. */
  const listFilteredRatings = async (queryString: string): Promise<string[]> => {
    const res = await request(app)
      .get(`${Endpoints.RATINGS_BASE_PATH}?${queryString}`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(200)
    return (res.body as RatedItem[]).map((ratedItem) => `${ratedItem.item.name} ${ratedItem.rating}`)
  }

  beforeAll(async () => {
    otherUserToken = await getUserRoleAuthToken(app)
    authorAttribute = await createTestAttribute(app, testAuthToken, `Author-${Date.now()}`, AttributeValueType.STRING)
    pagesAttribute = await createTestAttribute(app, testAuthToken, `Pages-${Date.now()}`, AttributeValueType.NUMBER)
    books = await createTestCategory(app, testAuthToken, `Books-${Date.now()}`, 'Filter books', [authorAttribute.id, pagesAttribute.id])
    const movies = await createTestCategory(app, testAuthToken, `Movies-${Date.now()}`, 'Filter movies')
    const dune = await createTestItemInCategory(app, testAuthToken, books.id, 'Dune', 'Desert planet', [
      { attributeId: authorAttribute.id, value: 'Frank Herbert' }, { attributeId: pagesAttribute.id, value: '412' },
    ])
    const emma = await createTestItemInCategory(app, testAuthToken, books.id, 'Emma', 'Matchmaking', [
      { attributeId: authorAttribute.id, value: 'Jane Austen' }, { attributeId: pagesAttribute.id, value: '474' },
    ])
    const alien = await createTestItemInCategory(app, testAuthToken, movies.id, 'Alien', 'Space horror')

    // The admin rates Dune 9 and Emma 4; another user rates Dune 5 and Alien 7
    await createTestRating(app, testAuthToken, dune.id, 9)
    await createTestRating(app, testAuthToken, emma.id, 4)
    await createTestRating(app, otherUserToken, dune.id, 5)
    await createTestRating(app, otherUserToken, alien.id, 7)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
  })

  it('should keep every rating of the items whose name contains the text, ignoring case', async () => {
    // GIVEN the ratings (beforeAll)
    // WHEN filtering by "dUN"
    const ratings = await listFilteredRatings('name=dUN')

    // THEN both users' ratings of Dune come back
    expect(ratings).toEqual(['Dune 9', 'Dune 5'])
  })

  it('should keep the ratings of items in the given categories', async () => {
    // GIVEN the ratings (beforeAll)
    // WHEN filtering by the Books category
    const ratings = await listFilteredRatings(`categoryId=${books.id}`)

    // THEN only the books' ratings come back
    expect(ratings).toEqual(['Dune 9', 'Emma 4', 'Dune 5'])
  })

  it('should match text attributes by part of the value and other attributes by the whole value', async () => {
    // GIVEN the ratings (beforeAll)
    // WHEN filtering by an author containing "herbert", and by 474 pages
    const byAuthor = await listFilteredRatings(`attribute=${encodeURIComponent(`${authorAttribute.id}:herbert`)}`)
    const byPages = await listFilteredRatings(`attribute=${pagesAttribute.id}:474`)
    const byBoth = await listFilteredRatings(`attribute=${authorAttribute.id}:herbert&attribute=${pagesAttribute.id}:474`)

    // THEN Dune matches the author, Emma the pages, and no book matches both
    expect(byAuthor).toEqual(['Dune 9', 'Dune 5'])
    expect(byPages).toEqual(['Emma 4'])
    expect(byBoth).toEqual([])
  })

  it('should keep the items whose collective grade is within the range for everyone\'s ratings', async () => {
    // GIVEN Dune's collective grade is 7, Emma's 4 and Alien's 7
    // WHEN filtering everyone's ratings from grade 6 to 7
    const ratings = await listFilteredRatings(`scope=${RankingScope.ALL}&minGrade=6&maxGrade=7`)

    // THEN Dune and Alien come back with all their ratings
    expect(ratings).toEqual(['Dune 9', 'Dune 5', 'Alien 7'])
  })

  it('should keep the items I rated, by my personal grade, for my ratings', async () => {
    // GIVEN my personal grades are 9 for Dune and 4 for Emma, and I did not rate Alien
    // WHEN filtering my ratings without a range, and from grade 8
    const mine = await listFilteredRatings(`scope=${RankingScope.MINE}`)
    const mineFromEight = await listFilteredRatings(`scope=${RankingScope.MINE}&minGrade=8`)

    // THEN my items come back with everyone's ratings of them, and only Dune from grade 8
    expect(mine).toEqual(['Dune 9', 'Emma 4', 'Dune 5'])
    expect(mineFromEight).toEqual(['Dune 9', 'Dune 5'])
  })

  it('should reject a filter with a value it cannot use', async () => {
    // GIVEN a minimum grade above the rating scale
    // WHEN listing ratings with it
    // THEN the request fails validation with a message naming the filter
    await request(app)
      .get(`${Endpoints.RATINGS_BASE_PATH}?minGrade=11`)
      .set('Authorization', `Bearer ${testAuthToken}`)
      .expect(400)
      .expect(res => {
        const apiError = res.body as APIError
        expect(apiError.message).toBe('Invalid value for minGrade: it must be a number from 0 to 10')
        expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      })
  })
})
