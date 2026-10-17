import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Message } from 'react-bulma-components'
import {
  ImportSource, createItem, findImportItems, getCategories, type CategoryResponse, type ImportedItem, type ItemInput,
  type ItemResponse,
} from '@/api/generated/api'

/** Side length, in pixels, of the pictures shown next to found interests. */
const IMPORTED_IMAGE_SIZE = 48

/** What the import screen shows for each source the generated API client lists. */
const IMPORT_SOURCE_LABELS: Record<ImportSource, { label: string, queryLabel: string }> = {
  [ImportSource.LASTFM]: { label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
  [ImportSource.YOUTUBE]: { label: 'YouTube', queryLabel: 'Video or playlist URL' },
}

/**
 * Screen to find interests on Last.fm or YouTube and add the chosen ones as items of a category,
 * with links to rate each imported item.
 */
const ImportPage: React.FC = () => {
  const [source, setSource] = useState(ImportSource.LASTFM)
  const [query, setQuery] = useState('')
  const [foundItems, setFoundItems] = useState<ImportedItem[]>([])
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [importedItems, setImportedItems] = useState<ItemResponse[]>([])
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setError('')
    setImportedItems([])
    try {
      const items = await findImportItems(source, { query })
      setFoundItems(items)
      setSelectedIndexes(items.map((_item, index) => index))
    } catch (err) {
      setFoundItems([])
      setError(err instanceof Error ? err.message : 'Failed to find interests')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSelected = (index: number) => {
    setSelectedIndexes(selectedIndexes.includes(index)
      ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
      : [...selectedIndexes, index])
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsImporting(true)
    setError('')
    try {
      const itemInputs: ItemInput[] = selectedIndexes.map((index) => ({
        name: foundItems[index].name,
        description: foundItems[index].description,
        imageUrl: foundItems[index].imageUrl ?? null,
        categoryId: Number(categoryId),
        attributeValues: [],
      }))
      setImportedItems(await Promise.all(itemInputs.map((itemInput) => createItem(itemInput))))
      setFoundItems([])
      setSelectedIndexes([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import the interests')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <h2 className="title is-4">Import interests</h2>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}
      {importedItems.length > 0 && (
        <Message color="success">
          <Message.Body>
            <p>{`Imported ${importedItems.length} interests. Rate them to add them to your interests:`}</p>
            <ul>
              {importedItems.map((item) => (
                <li key={item.id}>
                  {`${item.name} `}
                  <Link to={`/interests/${item.id}/edit`} aria-label={`Rate ${item.name}`}>Rate</Link>
                </li>
              ))}
            </ul>
          </Message.Body>
        </Message>
      )}
      <Box>
        <form onSubmit={handleSearch}>
          <div className="field is-grouped is-grouped-multiline is-align-items-flex-end">
            <div className="control">
              <label className="label" htmlFor="import-source">Import from</label>
              <div className="select">
                <select id="import-source" value={source} onChange={(e) => setSource(e.target.value as ImportSource)}>
                  {Object.values(ImportSource).map((importSource) => (
                    <option key={importSource} value={importSource}>{IMPORT_SOURCE_LABELS[importSource].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="control is-expanded">
              <label className="label" htmlFor="import-query">{IMPORT_SOURCE_LABELS[source].queryLabel}</label>
              <input className="input" id="import-query" value={query} onChange={(e) => setQuery(e.target.value)} required />
            </div>
            <div className="control">
              <button type="submit" className={`button is-link${isSearching ? ' is-loading' : ''}`} disabled={isSearching}>
                Find
              </button>
            </div>
          </div>
        </form>
      </Box>
      {foundItems.length > 0 && (
        <Box>
          <form onSubmit={handleImport}>
            <div className="table-container">
              <table className="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th aria-label="Picture" />
                    <th>Type</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Import</th>
                  </tr>
                </thead>
                <tbody>
                  {foundItems.map((item, index) => (
                    <tr key={`${index}-${item.name}`}>
                      <td>
                        {item.imageUrl && <img src={item.imageUrl} alt="" width={IMPORTED_IMAGE_SIZE} height={IMPORTED_IMAGE_SIZE} />}
                      </td>
                      <td>{item.type}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.name}`}
                          checked={selectedIndexes.includes(index)}
                          onChange={() => toggleSelected(index)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="field is-grouped is-grouped-multiline is-align-items-flex-end">
              <div className="control">
                <label className="label" htmlFor="import-category">Add to category</label>
                <div className="select">
                  <select id="import-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    <option value="" disabled>Choose a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="control">
                <button
                  type="submit"
                  className={`button is-primary${isImporting ? ' is-loading' : ''}`}
                  disabled={isImporting || selectedIndexes.length === 0}
                >
                  {`Import ${selectedIndexes.length} selected`}
                </button>
              </div>
            </div>
          </form>
        </Box>
      )}
    </>
  )
}

export default ImportPage
