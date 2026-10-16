import { describeChangeRequest, listChanges } from '@/components/moderation/changeRequestText'
import { testAttributes, testCategories } from '@/components/tests/common/Categories'
import { pendingItemChange, rejectedCategoryChange } from '@/components/tests/common/ChangeRequests'

/** Lookups built from the shared category fixtures. */
const lookups = { categories: testCategories, attributes: testAttributes }

describe('changeRequestText', () => {
  test('describes what a request proposes', () => {
    // GIVEN an interest edit and a new category
    // WHEN they are described
    const descriptions = [describeChangeRequest(pendingItemChange), describeChangeRequest(rejectedCategoryChange)]

    // THEN each names the action, the kind of target and its name
    expect(descriptions).toEqual(['Edit interest "Dune"', 'Add category "Games"'])
  })

  test('lists proposed values with names instead of ids', () => {
    // GIVEN an interest edit naming Books and its Pages attribute by id
    // WHEN its changes are listed
    const rows = listChanges(pendingItemChange.changes, lookups)

    // THEN the category and attribute are named and unsent fields are skipped
    expect(rows).toEqual([['Name', 'Dune'], ['Category', 'Books'], ['Details', 'Pages: 420']])
  })

  test('marks emptied lists and unknown ids', () => {
    // GIVEN category changes removing all attributes, and item changes naming a missing category
    // WHEN they are listed
    const categoryRows = listChanges(rejectedCategoryChange.changes, lookups)
    const itemRows = listChanges({ categoryId: 99 }, lookups)

    // THEN the empty list reads None and the missing category shows its id
    expect(categoryRows).toEqual([['Name', 'Games'], ['Description', 'Video games'], ['Attributes', 'None']])
    expect(itemRows).toEqual([['Category', '#99']])
  })

  test('names the linked attributes of a category, and shows the id of one that no longer exists', () => {
    // GIVEN category changes linking Author and a deleted attribute
    // WHEN they are listed
    const rows = listChanges({ ...rejectedCategoryChange.changes, attributeIds: [1, 99] }, lookups)

    // THEN Author is named and the deleted attribute shows its id
    expect(rows).toEqual([['Name', 'Games'], ['Description', 'Video games'], ['Attributes', 'Author, #99']])
  })

  test('lists nothing for a removal', () => {
    // GIVEN a removal, which carries no changes
    // WHEN its changes are listed
    const rows = listChanges(null, lookups)

    // THEN there are no rows
    expect(rows).toEqual([])
  })
})
