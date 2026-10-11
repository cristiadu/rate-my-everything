import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import Category from '@/models/Category'
import ChangeRequest from '@/models/ChangeRequest'
import ChangeRequestAction from '@/models/ChangeRequestAction'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import ChangeRequestTarget from '@/models/ChangeRequestTarget'
import Item from '@/models/Item'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'

describe('Change request and moderation API Integration Tests', async () => {
  const app = await appReady
  const adminToken = await getAuthTokenFromFile()
  let userToken: string
  let otherUserToken: string
  let moderatorToken: string
  let pagesAttribute: Attribute
  let testCategory: Category
  let testItem: Item
  let proposedCategoryName: string

  /** Submits a change request as the given user. */
  const submit = (token: string, body: object) => request(app)
    .post(Endpoints.CHANGE_REQUESTS_BASE_PATH)
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  /** Approves or rejects a change request as the given user. */
  const review = (token: string, changeRequestId: number, decision: 'approve' | 'reject', body: object = {}) => request(app)
    .put(`${Endpoints.MODERATION_BASE_PATH}/${changeRequestId}/${decision}`)
    .set('Authorization', `Bearer ${token}`)
    .send(body)

  beforeAll(async () => {
    userToken = await getUserRoleAuthToken(app)
    otherUserToken = await getUserRoleAuthToken(app)
    moderatorToken = await getUserRoleAuthToken(app, [UserRole.USER, UserRole.MODERATOR])

    const attributeRes = await request(app)
      .post(Endpoints.ATTRIBUTES_BASE_PATH)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Moderated-Pages-${Date.now()}`, valueType: AttributeValueType.NUMBER })
      .expect(201)
    pagesAttribute = attributeRes.body

    const categoryRes = await request(app)
      .post(Endpoints.CATEGORIES_BASE_PATH)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Moderated-${Date.now()}`, description: 'Original description' })
      .expect(201)
    testCategory = categoryRes.body

    const itemRes = await request(app)
      .post(Endpoints.ITEMS_BASE_PATH)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Dune', description: 'Desert planet', categoryId: testCategory.id })
      .expect(201)
    testItem = itemRes.body
  })

  afterAll(async () => {
    // Remove what this file created so tests that expect an empty catalog still pass after it
    await request(app).delete(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`).set('Authorization', `Bearer ${adminToken}`).expect(204)
    for (const name of [testCategory.name, proposedCategoryName]) {
      await request(app).delete(`${Endpoints.CATEGORIES_BASE_PATH}/${name}`).set('Authorization', `Bearer ${adminToken}`).expect(204)
    }
  })

  describe(`POST ${Endpoints.CHANGE_REQUESTS_BASE_PATH}`, () => {
    it('saves a pending interest change without applying it', async () => {
      // GIVEN a user proposing a new description for an interest
      const body = {
        targetType: ChangeRequestTarget.ITEM,
        action: ChangeRequestAction.UPDATE,
        targetId: testItem.id,
        changes: { description: 'Spice and sandworms', role: 'ignored' },
      }

      // WHEN it is submitted
      const res = await submit(userToken, body).expect('Content-Type', /json/).expect(201)

      // THEN it is pending, names its target and requester, and keeps only item fields
      const changeRequest = res.body as ChangeRequest
      expect(changeRequest.status).toBe(ChangeRequestStatus.PENDING)
      expect(changeRequest.targetName).toBe('Dune')
      expect(changeRequest.changes).toEqual({ description: 'Spice and sandworms' })
      expect(Object.keys(changeRequest.requestedBy).sort()).toEqual(['id', 'username'])
      expect(changeRequest.reviewedBy).toBeNull()

      // AND the interest is unchanged
      const itemRes = await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
      expect((itemRes.body as Item).description).toBe('Desert planet')
    })

    it.each([
      [{ targetType: 'rating', action: ChangeRequestAction.UPDATE, targetId: 1 }, 'targetType must be one of: item, category'],
      [
        { targetType: ChangeRequestTarget.ITEM, action: ChangeRequestAction.CREATE, changes: { name: 'X' } },
        'action for item must be one of: update',
      ],
      [{ targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.UPDATE, changes: {} }, 'targetId must be an integer'],
      [
        { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.CREATE, changes: {} },
        'Missing required field: changes.name',
      ],
      [{ targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.UPDATE, targetId: 1 }, 'changes must be an object'],
    ])('rejects a malformed request %#', async (body, message) => {
      // GIVEN a malformed change request
      // WHEN it is submitted
      // THEN it is refused with the reason
      await submit(userToken, body)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
          expect(apiError.message).toBe(message)
        })
    })

    it('rejects a change to a category that does not exist', async () => {
      // GIVEN a category id nobody uses
      // WHEN a deletion is proposed for it
      // THEN it is refused as unknown
      await submit(userToken, { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.DELETE, targetId: 999999 })
        .expect(422)
        .expect(res => expect((res.body as APIError).message).toBe('Unknown category id: 999999'))
    })
  })

  describe(`GET ${Endpoints.CHANGE_REQUESTS_BASE_PATH}`, () => {
    it("lists only the signed-in user's requests", async () => {
      // GIVEN another user with a request of their own
      await submit(otherUserToken, {
        targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.CREATE, changes: { name: `Other-${Date.now()}` },
      }).expect(201)

      // WHEN the first user lists their requests
      const res = await request(app)
        .get(Endpoints.CHANGE_REQUESTS_BASE_PATH)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // THEN only their interest change is returned
      const changeRequests = res.body as ChangeRequest[]
      expect(changeRequests.map((changeRequest) => changeRequest.targetName)).toEqual(['Dune'])
    })
  })

  describe(`GET ${Endpoints.MODERATION_BASE_PATH}`, () => {
    it('forbids users without a moderation role', async () => {
      // GIVEN a plain user
      // WHEN they list change requests for review
      // THEN it is forbidden
      await request(app)
        .get(Endpoints.MODERATION_BASE_PATH)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect(res => expect((res.body as APIError).code).toBe(ErrorCode.FORBIDDEN))
    })

    it('lists pending requests to moderators', async () => {
      // GIVEN the pending requests submitted above
      // WHEN a moderator lists pending requests
      const res = await request(app)
        .get(`${Endpoints.MODERATION_BASE_PATH}?status=${ChangeRequestStatus.PENDING}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)

      // THEN every returned request is pending and the interest change is among them
      const changeRequests = res.body as ChangeRequest[]
      expect(changeRequests.every((changeRequest) => changeRequest.status === ChangeRequestStatus.PENDING)).toBe(true)
      expect(changeRequests.some((changeRequest) => changeRequest.targetName === 'Dune')).toBe(true)
    })

    it('rejects an unknown status filter', async () => {
      await request(app)
        .get(`${Endpoints.MODERATION_BASE_PATH}?status=archived`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(400)
        .expect(res => expect((res.body as APIError).message).toBe('status must be one of: pending, approved, rejected'))
    })
  })

  describe(`PUT ${Endpoints.MODERATION_BASE_PATH}/:id/approve`, () => {
    it('applies an interest change and records the moderator', async () => {
      // GIVEN a pending interest change
      const submitted = await submit(userToken, {
        targetType: ChangeRequestTarget.ITEM, action: ChangeRequestAction.UPDATE, targetId: testItem.id, changes: { name: 'Dune Messiah' },
      }).expect(201)

      // WHEN a moderator approves it with a note
      const res = await review(moderatorToken, submitted.body.id, 'approve', { reviewNote: 'Correct title' }).expect(200)

      // THEN the request is approved by the moderator
      const changeRequest = res.body as ChangeRequest
      expect(changeRequest.status).toBe(ChangeRequestStatus.APPROVED)
      expect(changeRequest.reviewNote).toBe('Correct title')
      expect(changeRequest.reviewedBy?.username).toMatch(/^user-moderator-/)
      expect(changeRequest.reviewedAt).not.toBeNull()

      // AND the interest now has the new name
      const itemRes = await request(app)
        .get(`${Endpoints.ITEMS_BASE_PATH}/${testItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
      expect((itemRes.body as Item).name).toBe('Dune Messiah')
    })

    it('refuses to review a request twice', async () => {
      // GIVEN an approved request
      const submitted = await submit(userToken, {
        targetType: ChangeRequestTarget.ITEM, action: ChangeRequestAction.UPDATE, targetId: testItem.id, changes: { description: 'Again' },
      }).expect(201)
      await review(moderatorToken, submitted.body.id, 'approve').expect(200)

      // WHEN it is approved again
      // THEN it is refused
      await review(moderatorToken, submitted.body.id, 'approve')
        .expect(422)
        .expect(res => expect((res.body as APIError).message).toBe(`Change request ${submitted.body.id} is already approved`))
    })

    it('creates a proposed category with its attributes', async () => {
      // GIVEN a pending new category linked to Pages
      const name = `Proposed-${Date.now()}`
      proposedCategoryName = name
      const submitted = await submit(userToken, {
        targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.CREATE, changes: { name, attributeIds: [pagesAttribute.id] },
      }).expect(201)

      // WHEN an admin approves it
      await review(adminToken, submitted.body.id, 'approve').expect(200)

      // THEN the category exists with Pages linked
      const categoryRes = await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/${name}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
      expect((categoryRes.body as Category).attributes.map((attribute) => attribute.id)).toEqual([pagesAttribute.id])
    })

    it('fails when the category was deleted after the request', async () => {
      // GIVEN a pending change to a category that is then deleted
      const name = `Doomed-${Date.now()}`
      const categoryRes = await request(app)
        .post(Endpoints.CATEGORIES_BASE_PATH)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name })
        .expect(201)
      const submitted = await submit(userToken, {
        targetType: ChangeRequestTarget.CATEGORY,
        action: ChangeRequestAction.UPDATE,
        targetId: categoryRes.body.id,
        changes: { description: 'New' },
      }).expect(201)
      await request(app).delete(`${Endpoints.CATEGORIES_BASE_PATH}/${name}`).set('Authorization', `Bearer ${adminToken}`).expect(204)

      // WHEN it is approved
      // THEN approval fails and the request stays pending
      await review(moderatorToken, submitted.body.id, 'approve')
        .expect(422)
        .expect(res => expect((res.body as APIError).message).toBe(`Unknown category id: ${categoryRes.body.id}`))
      const listRes = await request(app)
        .get(`${Endpoints.MODERATION_BASE_PATH}?status=${ChangeRequestStatus.PENDING}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
      expect((listRes.body as ChangeRequest[]).some((changeRequest) => changeRequest.id === submitted.body.id)).toBe(true)
    })

    it('returns 404 for an unknown request', async () => {
      await review(moderatorToken, 999999, 'approve')
        .expect(404)
        .expect(res => expect((res.body as APIError).message).toBe('Change request not found'))
    })
  })

  describe(`PUT ${Endpoints.MODERATION_BASE_PATH}/:id/reject`, () => {
    it('rejects a category deletion and leaves the category in place', async () => {
      // GIVEN a pending deletion of the test category
      const submitted = await submit(userToken, {
        targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.DELETE, targetId: testCategory.id,
      }).expect(201)
      expect(submitted.body.changes).toBeNull()

      // WHEN a moderator rejects it with a note
      const res = await review(moderatorToken, submitted.body.id, 'reject', { reviewNote: 'Still in use' }).expect(200)

      // THEN the request is rejected and the category still exists
      expect((res.body as ChangeRequest).status).toBe(ChangeRequestStatus.REJECTED)
      expect((res.body as ChangeRequest).reviewNote).toBe('Still in use')
      await request(app)
        .get(`${Endpoints.CATEGORIES_BASE_PATH}/${testCategory.name}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    })

    it('forbids users without a moderation role', async () => {
      await review(userToken, 1, 'reject').expect(403)
    })
  })
})
