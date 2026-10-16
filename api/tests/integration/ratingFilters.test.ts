import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import RatedItem from '@/models/RatedItem'
import Category from '@/models/Category'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import RankingScope from '@/models/RankingScope'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { createTestItemInCategory } from '@@/testutils/common/Items'
import { createTestRating } from '@@/testutils/common/Ratings'
import { createTestCategory } from '@@/testutils/common/Categories'
import { createTestAttribute } from '@@/testutils/common/Attributes'
import { Endpoints } from '@@/testutils/common/constants'

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
    await cleanupAllCategories(app)
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
        expect(apiError.message).toContain('query.minGrade')
        expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      })
  })
})
