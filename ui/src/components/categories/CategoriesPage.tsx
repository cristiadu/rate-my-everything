import React, { useCallback, useEffect, useState } from 'react'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import {
  type Attribute, type Category, type CategoryFormValues, type StatusMessage, UserRole,
} from '@/components/types'
import { getRolesFromToken } from '@/components/admin/RequireAdmin'
import { useAuth } from '@/components/users/AuthContext'
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown'
import useSimilarRecords from '@/components/common/useSimilarRecords'

/** Form values for a new category. */
const emptyForm: CategoryFormValues = { name: '', description: '', attributeIds: [] }

/** API path for one category, which the API addresses by name. */
const categoryPath = (name: string) => `${ApiConfig.ENDPOINTS.CATEGORIES}/${encodeURIComponent(name)}`

/** Lists categories for every user; admins can also create, edit and delete them and link attributes. */
const CategoriesPage: React.FC = () => {
  const { token } = useAuth()
  const isAdmin = getRolesFromToken(token).includes(UserRole.ADMIN)
  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [formFields, setFormFields] = useState<CategoryFormValues>(emptyForm)
  // Categories are addressed by name in the API, so keep the name the category had before editing
  const [editingName, setEditingName] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusMessage>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Only new categories are checked for duplicates
  const similarCategories = useSimilarRecords<Category>(ApiConfig.ENDPOINTS.CATEGORIES, formFields.name, isAdmin && editingName === null)

  /** Fetches the category list from the API. */
  const loadCategories = useCallback(async () => {
    try {
      setCategories(await ApiService.get<Category[]>(ApiConfig.ENDPOINTS.CATEGORIES))
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load categories', isSuccess: false })
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  /** Fetches the attributes an admin can link to a category. */
  const loadAttributes = useCallback(async () => {
    try {
      setAttributes(await ApiService.get<Attribute[]>(ApiConfig.ENDPOINTS.ATTRIBUTES))
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load attributes', isSuccess: false })
    }
  }, [])

  useEffect(() => {
    // Only admins can change categories or list attributes, so other users just browse
    if (isAdmin) {
      loadAttributes()
    }
  }, [isAdmin, loadAttributes])

  /** Clears the form back to a new category. */
  const resetForm = () => {
    setFormFields(emptyForm)
    setEditingName(null)
  }

  /** Creates or updates the category in the form, then reloads the list. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatus(null)

    try {
      if (editingName === null) {
        await ApiService.post<Category>(ApiConfig.ENDPOINTS.CATEGORIES, formFields)
        setStatus({ message: `Category ${formFields.name} created.`, isSuccess: true })
      } else {
        await ApiService.put<Category>(categoryPath(editingName), formFields)
        setStatus({ message: `Category ${formFields.name} updated.`, isSuccess: true })
      }
      resetForm()
      await loadCategories()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to save category', isSuccess: false })
    } finally {
      setIsSaving(false)
    }
  }

  /** Loads a category into the form for editing. */
  const handleEdit = (category: Category) => {
    setFormFields({
      name: category.name,
      description: category.description ?? '',
      attributeIds: category.attributes.map((attribute) => attribute.id),
    })
    setEditingName(category.name)
  }

  /** Deletes the category after the admin confirms, then reloads the list. */
  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category ${category.name}?`)) {
      return
    }

    setStatus(null)
    try {
      await ApiService.delete<void>(categoryPath(category.name))
      setStatus({ message: `Category ${category.name} deleted.`, isSuccess: true })
      if (editingName === category.name) {
        resetForm()
      }
      await loadCategories()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to delete category', isSuccess: false })
    }
  }

  return (
    <div className="box">
      <h2 className="title is-4">Categories</h2>

      {status && (
        <div className={`notification ${status.isSuccess ? 'is-success' : 'is-danger'}`} role="status">
          {status.message}
        </div>
      )}

      {isAdmin && (
        <div className="box">
          <form onSubmit={handleSubmit} aria-label={editingName === null ? 'Create category' : 'Edit category'}>
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
              {similarCategories.length > 0 && (
                <div className="notification is-warning is-light mt-2" role="status" aria-label="Similar categories">
                  <p>Similar categories already exist. Edit one of them instead of adding a duplicate:</p>
                  <div className="buttons mt-2">
                    {similarCategories.map((category) => (
                      <button key={category.id} className="button is-small" type="button" onClick={() => handleEdit(category)}>
                        {`Edit ${category.name}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            <div className="field">
              <label className="label" htmlFor="category-attributes">Attributes</label>
              {attributes.length === 0 ? (
                <p className="is-size-7">No attributes yet. Create them on the <a href="/admin/attributes">attributes page</a>.</p>
              ) : (
                <div className="control">
                  <MultiSelectDropdown
                    id="category-attributes"
                    label="Attributes"
                    placeholder="Select attributes"
                    options={attributes.map((attribute) => ({ value: attribute.id, label: `${attribute.name} (${attribute.valueType})` }))}
                    selected={formFields.attributeIds}
                    onChange={(attributeIds) => setFormFields({ ...formFields, attributeIds })}
                  />
                </div>
              )}
            </div>
            <div className="field is-grouped">
              <div className="control">
                <button className={`button is-primary ${isSaving ? 'is-loading' : ''}`} type="submit" disabled={isSaving}>
                  {editingName === null ? 'Create category' : 'Save changes'}
                </button>
              </div>
              {editingName !== null && (
                <div className="control">
                  <button className="button is-light" type="button" onClick={resetForm}>Cancel</button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      <table className="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Attributes</th>
            {isAdmin && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 4 : 3}>No categories yet.</td>
            </tr>
          )}
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <div className="tags">
                  {category.attributes.map((attribute) => (
                    <span key={attribute.id} className="tag is-info" title={attribute.valueType}>{attribute.name}</span>
                  ))}
                </div>
              </td>
              {isAdmin && (
                <td className="has-text-right">
                  <button className="button is-small mr-2" type="button" onClick={() => handleEdit(category)}>
                    Edit
                  </button>
                  <button className="button is-small is-danger" type="button" onClick={() => handleDelete(category)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriesPage
