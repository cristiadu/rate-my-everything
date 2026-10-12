import request from 'supertest'
import type { Express } from 'express'
import Comment from '@/models/Comment'
import { Endpoints } from '@@/testutils/common/constants'

/** Posts a comment body to its item-scoped endpoint with the given token; callers assert the response. */
export const postComment = (app: Express, authToken: string, body: { item_id: number; body: string }) => request(app)
  .post(`${Endpoints.COMMENTS_BASE_PATH}/item/${body.item_id}`)
  .set('Authorization', `Bearer ${authToken}`)
  .send({ body: body.body })

/** Lists the comments on an item with the given token. */
export const listComments = async (app: Express, authToken: string, itemId: number): Promise<Comment[]> => {
  const res = await request(app)
    .get(`${Endpoints.COMMENTS_BASE_PATH}/item/${itemId}`)
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)
  return res.body as Comment[]
}
