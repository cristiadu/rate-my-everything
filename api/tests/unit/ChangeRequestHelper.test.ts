import { describe, it, expect } from 'vitest'
import { findChangeRequestError, pickChanges } from '@/helpers/ChangeRequestHelper'
import { ChangeRequestInput } from '@/models/ChangeRequest'
import ChangeRequestAction from '@/models/ChangeRequestAction'
import ChangeRequestTarget from '@/models/ChangeRequestTarget'

/** A target type a request body can carry although it is not a ChangeRequestTarget. */
const UNSUPPORTED_TARGET_TYPE: string = 'rating'

describe('findChangeRequestError', () => {
  it.each([
    { targetType: ChangeRequestTarget.ITEM, action: ChangeRequestAction.UPDATE, targetId: 1, changes: { name: 'Dune' } },
    { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.CREATE, changes: { name: 'Books', attributeIds: [1] } },
    { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.DELETE, targetId: 1 },
  ] as ChangeRequestInput[])('accepts a well-formed request %#', (input) => {
    // GIVEN a well-formed change request
    // WHEN it is checked
    // THEN no error is found
    expect(findChangeRequestError(input)).toBeNull()
  })

  it('rejects a target type that cannot be changed', () => {
    // GIVEN a change request for a rating, which is not an item or a category
    const input: ChangeRequestInput = {
      targetType: UNSUPPORTED_TARGET_TYPE as ChangeRequestTarget, action: ChangeRequestAction.UPDATE, targetId: 1, changes: {},
    }

    // WHEN it is checked
    // THEN the allowed target types are named
    expect(findChangeRequestError(input)).toBe('targetType must be one of: item, category')
  })

  it('rejects category changes with non-integer attribute ids', () => {
    // GIVEN a category update linking attribute ids that are not integers
    const input: ChangeRequestInput = {
      targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.UPDATE, targetId: 1, changes: { attributeIds: [1.5] },
    }

    // WHEN it is checked
    // THEN the attribute ids are named as the problem
    expect(findChangeRequestError(input)).toBe('attributeIds must be an array of integers')
  })
})

describe('pickChanges', () => {
  it('keeps only the fields the categories API accepts', () => {
    // GIVEN category changes with an extra id field
    const changes = { name: 'Books', description: 'Read', attributeIds: [1], id: 7 }

    // WHEN the changes are picked
    const picked = pickChanges(ChangeRequestTarget.CATEGORY, changes)

    // THEN the id is dropped
    expect(picked).toEqual({ name: 'Books', description: 'Read', attributeIds: [1] })
  })

  it('returns null when nothing was sent', () => {
    expect(pickChanges(ChangeRequestTarget.ITEM, undefined)).toBeNull()
  })
})
