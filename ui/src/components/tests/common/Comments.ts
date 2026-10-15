import type { CommentResponse } from '@/api/generated/api'

/** Comment by the signed-in test user, whose token carries the username "admin". */
export const myComment: CommentResponse = {
  id: 700, body: 'Best sci-fi ever written', createdAt: '2026-10-01T10:00:00Z', item: { id: 100 }, user: { id: 1, username: 'admin' },
}

/** Comment by another user, posted after mine. */
export const otherUserComment: CommentResponse = {
  id: 701, body: 'The sequels are better', createdAt: '2026-10-02T10:00:00Z', item: { id: 100 }, user: { id: 2, username: 'paul' },
}
