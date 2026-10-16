import Item from '@/models/Item'

/** Number of items requested from a paginated external service at a time. */
export const IMPORT_PAGE_SIZE = 50

/** Provider-specific display label for an imported result, such as Artist, Album, Song, or Video. */
export type ImportedItemType = string

/** An interest found on an external service, with the item fields it fills in. */
export interface ImportedItem extends Pick<Item, 'name' | 'description' | 'imageUrl'> {
  type: ImportedItemType
}
