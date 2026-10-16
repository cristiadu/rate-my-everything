import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Comment, { MAX_COMMENT_LENGTH } from '@/models/Comment'
import Item from '@/models/Item'
import ErrorCode from '@/errors/ErrorCode'
import { TEST_USER } from '@@/testutils/setup'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { cleanupAllCategories, cleanupAllItems, cleanupAllRatedItems } from '@@/testutils/common/DataCleanup'
import { createTestItem } from '@@/testutils/common/Items'
import { listComments, postComment } from '@@/testutils/common/Comments'
import { Endpoints } from '@@/testutils/common/constants'

describe('Comment API Integration Tests', async () => {
  const app = await appReady
  const adminToken = await getAuthTokenFromFile()
  let userToken: string
  let otherUserToken: string
  let testItem: Item

  beforeAll(async () => {
    await cleanupAllRatedItems(app)
    await cleanupAllItems(app)
    await cleanupAllCategories(app)
    testItem = await createTestItem(app, adminToken, 'Comment')
    userToken = await getUserRoleAuthToken(app)
    otherUserToken = await getUserRoleAuthToken(app)
  })

  describe(`POST ${Endpoints.COMMENTS_BASE_PATH}/item/:item_id`, () => {
    it('should post a trimmed comment by the signed-in user without exposing private user fields', async () => {
      // GIVEN a comment body with surrounding whitespace
      const body = { item_id: testItem.id, body: '  Loved the ending  ' }

      // WHEN the admin test user posts it
      const res = await postComment(app, adminToken, body).expect('Content-Type', /json/).expect(201)

      // THEN it is saved for that user and item, and the author only carries id and username
      const comment = res.body as Comment
      expect(comment.body).toBe('Loved the ending')
      expect(comment.item.id).toBe(testItem.id)
      expect(comment.user.username).toBe(TEST_USER.email)
      expect(Object.keys(comment.user).sort()).toEqual(['id', 'username'])
      expect(comment.createdAt).toBeDefined()
    })

    it('should reject a blank comment', async () => {
      // GIVEN a body made only of whitespace
      const body = { item_id: testItem.id, body: '   ' }

      // WHEN it is posted
      const res = await postComment(app, userToken, body).expect(400)

      // THEN a validation error names the required fields
      const apiError = res.body as APIError
      expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(apiError.message).toBe('Missing required fields: item_id, body')
    })

    it('should reject a comment longer than the maximum length', async () => {
      // GIVEN a body one character over the limit
      const body = { item_id: testItem.id, body: 'a'.repeat(MAX_COMMENT_LENGTH + 1) }

      // WHEN it is posted
      const res = await postComment(app, userToken, body).expect(400)

      // THEN a validation error states the limit
      const apiError = res.body as APIError
      expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(apiError.message).toBe(`Invalid request: input.body: maxLength ${MAX_COMMENT_LENGTH}`)
    })

    it('should return 404 for an unknown item', async () => {
      // GIVEN an item id that does not exist
      const body = { item_id: 999999, body: 'Anyone there?' }

      // WHEN a comment is posted on it
      const res = await postComment(app, userToken, body).expect(404)

      // THEN the item is reported missing
      const apiError = res.body as APIError
      expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(apiError.message).toBe('Item not found')
    })
  })

  describe(`GET ${Endpoints.COMMENTS_BASE_PATH}/item/:item_id`, () => {
    it('should list the discussion of an item from several users, oldest first', async () => {
      // GIVEN the admin comment from earlier and a reply from a plain user
      await postComment(app, userToken, { item_id: testItem.id, body: 'Agreed, great twist' }).expect(201)

      // WHEN the discussion is listed
      const comments = await listComments(app, adminToken, testItem.id)

      // THEN both comments come back in the order they were posted
      expect(comments.map((comment) => comment.body)).toEqual(['Loved the ending', 'Agreed, great twist'])
      expect(comments[1].user.username).toMatch(/^plain-user-/)
    })

    it('should return an empty list for an item nobody discussed', async () => {
      // GIVEN an item without comments
      const quietItem = await createTestItem(app, adminToken, 'QuietComment')

      // WHEN its discussion is listed
      const comments = await listComments(app, adminToken, quietItem.id)

      // THEN it is empty
      expect(comments).toEqual([])
    })
  })

  describe(`DELETE ${Endpoints.COMMENTS_BASE_PATH}/:id`, () => {
    it('should forbid deleting another user\'s comment', async () => {
      // GIVEN a comment by one plain user
      const comment = (await postComment(app, userToken, { item_id: testItem.id, body: 'Mine to keep' }).expect(201)).body as Comment

      // WHEN a different plain user tries to delete it
      const res = await request(app)
        .delete(`${Endpoints.COMMENTS_BASE_PATH}/${comment.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)

      // THEN the request is refused and the comment stays
      expect((res.body as APIError).code).toBe(ErrorCode.FORBIDDEN)
      expect((await listComments(app, adminToken, testItem.id)).map((current) => current.id)).toContain(comment.id)
    })

    it('should let the author delete their own comment', async () => {
      // GIVEN a comment by a plain user
      const comment = (await postComment(app, userToken, { item_id: testItem.id, body: 'Typo, reposting' }).expect(201)).body as Comment

      // WHEN its author deletes it
      await request(app)
        .delete(`${Endpoints.COMMENTS_BASE_PATH}/${comment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204)

      // THEN it is gone from the discussion
      expect((await listComments(app, adminToken, testItem.id)).map((current) => current.id)).not.toContain(comment.id)
    })

    it('should let an admin delete any comment', async () => {
      // GIVEN a comment by a plain user
      const comment = (await postComment(app, otherUserToken, { item_id: testItem.id, body: 'Off topic' }).expect(201)).body as Comment

      // WHEN an admin deletes it
      await request(app)
        .delete(`${Endpoints.COMMENTS_BASE_PATH}/${comment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204)

      // THEN it is gone from the discussion
      expect((await listComments(app, adminToken, testItem.id)).map((current) => current.id)).not.toContain(comment.id)
    })

    it('should remove an item\'s discussion when the item is deleted', async () => {
      // GIVEN an item with a comment
      const doomedItem = await createTestItem(app, adminToken, 'DoomedComment')
      await postComment(app, userToken, { item_id: doomedItem.id, body: 'Short-lived' }).expect(201)

      // WHEN the item is deleted
      await request(app)
        .delete(`${Endpoints.ITEMS_BASE_PATH}/${doomedItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204)

      // THEN its comments are deleted with it
      expect(await listComments(app, adminToken, doomedItem.id)).toEqual([])
    })
  })
})
