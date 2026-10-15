import {
  type ChangeRequest, ChangeRequestAction, ChangeRequestStatus, ChangeRequestTarget,
} from '@/components/types'

/** A pending edit of Dune's page count, sent by alice. */
export const pendingItemChange: ChangeRequest = {
  id: 1,
  targetType: ChangeRequestTarget.ITEM,
  action: ChangeRequestAction.UPDATE,
  targetId: 100,
  targetName: 'Dune',
  changes: { name: 'Dune', categoryId: 10, attributeValues: [{ attributeId: 2, value: '420' }] },
  status: ChangeRequestStatus.PENDING,
  requestedBy: { id: 2, username: 'alice' },
  reviewedBy: null,
  reviewNote: null,
  createdAt: '2026-10-11T15:00:00.000Z',
  reviewedAt: null,
}

/** alice's proposed Games category, rejected by a moderator with a note. */
export const rejectedCategoryChange: ChangeRequest = {
  id: 2,
  targetType: ChangeRequestTarget.CATEGORY,
  action: ChangeRequestAction.CREATE,
  targetId: null,
  targetName: 'Games',
  changes: { name: 'Games', description: 'Video games', attributeIds: [] },
  status: ChangeRequestStatus.REJECTED,
  requestedBy: { id: 2, username: 'alice' },
  reviewedBy: { id: 3, username: 'mod' },
  reviewNote: 'Already covered by Hobbies',
  createdAt: '2026-10-11T14:00:00.000Z',
  reviewedAt: '2026-10-11T14:30:00.000Z',
}
