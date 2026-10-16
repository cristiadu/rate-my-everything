import Item from '@/models/Item'
import ImportSource from '@/models/ImportSource'

/** Number of items requested from a paginated external service at a time. */
export const IMPORT_PAGE_SIZE = 50

/** Provider-specific display label for an imported result, such as Artist, Album, Song, or Video. */
export type ImportedItemType = string

/** An interest found on an external service, with the item fields it fills in. */
export interface ImportedItem extends Pick<Item, 'name' | 'description' | 'imageUrl'> {
  type: ImportedItemType
}

/** An external source interests can be imported from, with the labels the import screen shows for it. */
export interface ImportSourceDescription {
  source: ImportSource
  /**
   * Name of the source and what it imports.
   * @example "Last.fm artists and albums"
   */
  label: string
  /**
   * What the search box asks for.
   * @example "Last.fm username"
   */
  queryLabel: string
}
