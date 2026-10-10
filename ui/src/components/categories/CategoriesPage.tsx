import React, { useCallback, useEffect, useState } from 'react'
import {
  Box, Message, Table, Tag,
} from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { Attribute, Category } from '@/components/types'
import { useIsAdmin } from '@/components/users/sessionRoles'

interface CategoryForm {
  name: string;
  description: string;
  attributeIds: number[];
}

const emptyForm: CategoryForm = { name: '', description: '', attributeIds: [] }

const categoryPath = (name: string) => `${ApiConfig.ENDPOINTS.CATEGORIES}/${encodeURIComponent(name)}`

const CategoriesPage: React.FC = () => {
  const isAdmin = useIsAdmin()
  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [formFields, setFormFields] = useState<CategoryForm>(emptyForm)
  // Categories are addressed by name in the API, so keep the name the category had before editing
  const [editingName, setEditingName] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await ApiService.get<Category[]>(ApiConfig.ENDPOINTS.CATEGORIES))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    // Only admins can change categories or list attributes, so other users just browse
    if (!isAdmin) {
      return
    }
    ApiService.get<Attribute[]>(ApiConfig.ENDPOINTS.ATTRIBUTES)
      .then(setAttributes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load attributes'))
  }, [isAdmin])

  const resetForm = () => {
    setFormFields(emptyForm)
    setEditingName(null)
  }

  const toggleAttribute = (attributeId: number) => {
    const { attributeIds } = formFields
    setFormFields({
      ...formFields,
      attributeIds: attributeIds.includes(attributeId)
        ? attributeIds.filter((id) => id !== attributeId)
        : [...attributeIds, attributeId],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    const body = { ...formFields }

    try {
      if (editingName === null) {
        await ApiService.post<Category>(ApiConfig.ENDPOINTS.CATEGORIES, body)
      } else {
        await ApiService.put<Category>(categoryPath(editingName), body)
      }
      resetForm()
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setFormFields({
      name: category.name,
      description: category.description ?? '',
      attributeIds: category.attributes.map((attribute) => attribute.id),
    })
    setEditingName(category.name)
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return
    }

    setError('')
    try {
      await ApiService.delete(categoryPath(category.name))
      if (editingName === category.name) {
        resetForm()
      }
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return (
    <>
      <h2 className="title is-4">Categories</h2>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}

      {isAdmin && (
        <Box>
          <form onSubmit={handleSubmit}>
            <h3 className="title is-5">{editingName === null ? 'New category' : `Edit ${editingName}`}</h3>
            <div className="field">
              <label className="label" htmlFor="category-name">Name</label>
              <div className="control">
                <input
                  className="input"
                  id="category-name"
                  name="name"
                  value={formFields.name}
                  onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="category-description">Description</label>
              <div className="control">
                <textarea
                  className="textarea"
                  id="category-description"
                  name="description"
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                />
              </div>
            </div>
            <fieldset className="field">
                <legend className="label">Attributes</legend>
                {attributes.length === 0 ? (
                  <p className="is-size-7">No attributes yet. Create them on the <a href="/attributes">attributes page</a>.</p>
                ) : attributes.map((attribute) => (
                  <div className="control" key={attribute.id}>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={formFields.attributeIds.includes(attribute.id)}
                        onChange={() => toggleAttribute(attribute.id)}
                      />
                      {` ${attribute.name} (${attribute.valueType})`}
                    </label>
                  </div>
                ))}
              </fieldset>
            <div className="buttons">
              <button type="submit" className={`button is-primary${isSaving ? ' is-loading' : ''}`} disabled={isSaving}>
                {editingName === null ? 'Create category' : 'Save category'}
              </button>
              {editingName !== null && (
                <button type="button" className="button" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </Box>
      )}

      <Table striped hoverable size="fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Attributes</th>
            {isAdmin && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr><td colSpan={isAdmin ? 4 : 3}>No categories yet.</td></tr>
          ) : categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <Tag.Group>
                  {category.attributes.map((attribute) => (
                    <Tag key={attribute.id} color="info" title={attribute.valueType}>{attribute.name}</Tag>
                  ))}
                </Tag.Group>
              </td>
              {isAdmin && (
                <td>
                  <div className="buttons is-right">
                    <button type="button" className="button is-small" onClick={() => handleEdit(category)}>Edit</button>
                    <button type="button" className="button is-small is-danger" onClick={() => handleDelete(category)}>Delete</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}

export default CategoriesPage
