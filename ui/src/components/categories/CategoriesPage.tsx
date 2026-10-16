import React, { useCallback, useEffect, useState } from 'react'
import {
  ChangeRequestAction, ChangeRequestTarget, UserRole, createCategory, createChangeRequest, deleteCategory,
  getAttributes, getCategories, getSimilarCategories, updateCategory, type AttributeResponse, type CategoryResponse,
  type ChangeRequestInput,
} from '@/api/generated/api'
import type { CategoryFormValues, StatusMessage } from '@/components/types'
import { getRolesFromToken } from '@/components/admin/RequireAdmin'
import { useAuth } from '@/components/users/AuthContext'
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown'
import SimilarRecordsWarning from '@/components/common/SimilarRecordsWarning'

/** Form values for a new category. */
const emptyForm: CategoryFormValues = { name: '', description: '', attributeIds: [] }

/** Message shown after a user's proposed change to a category is saved for moderators. */
const SENT_FOR_APPROVAL_MESSAGE = 'Your change was sent to the moderators for approval.'

/**
 * Lists categories for every user. Admins create, edit and delete them and link attributes directly;
 * other users propose the same changes as change requests for moderators to approve.
 */
const CategoriesPage: React.FC = () => {
  const { token } = useAuth()
  const isAdmin = getRolesFromToken(token).includes(UserRole.ADMIN)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [attributes, setAttributes] = useState<AttributeResponse[]>([])
  const [formFields, setFormFields] = useState<CategoryFormValues>(emptyForm)
  // Categories are addressed by name in the API, so keep the name the category had before editing
  const [editingName, setEditingName] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusMessage>(null)
  const [isSaving, setIsSaving] = useState(false)

  /** Fetches the category list from the API. */
  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories())
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load categories', isSuccess: false })
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  /** Fetches the attributes that can be linked to a category. */
  const loadAttributes = useCallback(async () => {
    try {
      setAttributes(await getAttributes())
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load attributes', isSuccess: false })
    }
  }, [])

  useEffect(() => {
    loadAttributes()
  }, [loadAttributes])

  /** Clears the form back to a new category. */
  const resetForm = () => {
    setFormFields(emptyForm)
    setEditingName(null)
  }

  /** Sends a user's proposed category change to the moderators. */
  const proposeChange = async (changeRequestInput: ChangeRequestInput) => {
    await createChangeRequest(changeRequestInput)
    setStatus({ message: SENT_FOR_APPROVAL_MESSAGE, isSuccess: true })
  }

  /** Creates or updates the category in the form, then reloads the list; non-admins propose the change instead. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatus(null)

    try {
      if (!isAdmin) {
        const editingId = categories.find((category) => category.name === editingName)?.id
        await proposeChange(editingId === undefined
          ? { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.CREATE, changes: formFields }
          : { targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.UPDATE, targetId: editingId, changes: formFields })
      } else if (editingName === null) {
        await createCategory(formFields)
        setStatus({ message: `Category ${formFields.name} created.`, isSuccess: true })
      } else {
        await updateCategory(encodeURIComponent(editingName), formFields)
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
  const handleEdit = (category: CategoryResponse) => {
    setFormFields({
      name: category.name,
      description: category.description ?? '',
      attributeIds: category.attributes.map((attribute) => attribute.id),
    })
    setEditingName(category.name)
  }

  /** Deletes the category after the admin confirms, then reloads the list; non-admins propose the removal instead. */
  const handleDelete = async (category: CategoryResponse) => {
    if (!window.confirm(`${isAdmin ? 'Delete' : 'Suggest removing'} category ${category.name}?`)) {
      return
    }

    setStatus(null)
    try {
      if (!isAdmin) {
        await proposeChange({ targetType: ChangeRequestTarget.CATEGORY, action: ChangeRequestAction.DELETE, targetId: category.id })
        return
      }
      await deleteCategory(encodeURIComponent(category.name))
      setStatus({ message: `Category ${category.name} deleted.`, isSuccess: true })
      if (editingName === category.name) {
        resetForm()
      }
      await loadCategories()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to delete category', isSuccess: false })
    }
  }

  const formTitle = isAdmin
    ? (editingName === null ? 'New category' : `Edit ${editingName}`)
    : (editingName === null ? 'Suggest a new category' : `Suggest changes to ${editingName}`)
  const submitLabel = isAdmin ? (editingName === null ? 'Create category' : 'Save changes') : 'Send for approval'

  return (
    <div className="box">
      <h2 className="title is-4">Categories</h2>

      {status && (
        <div className={`notification ${status.isSuccess ? 'is-success' : 'is-danger'}`} role="status">
          {status.message}
        </div>
      )}

      <div className="box">
        <form onSubmit={handleSubmit} aria-label={editingName === null ? 'Create category' : 'Edit category'}>
          <h3 className="title is-5">{formTitle}</h3>
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
          <div className="field">
            <label className="label" htmlFor="category-attributes">Attributes</label>
            {attributes.length === 0 ? (
              <p className="is-size-7">
                No attributes yet.{isAdmin && <> Create them on the <a href="/admin/attributes">attributes page</a>.</>}
              </p>
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
                {submitLabel}
              </button>
              <SimilarRecordsWarning
                findSimilar={getSimilarCategories}
                name={formFields.name}
                isEnabled={editingName === null}
                label="Similar categories"
                message="Similar categories already exist. Edit one of them instead of adding a duplicate:"
                renderRecord={(category) => (
                  <button className="button is-small" type="button" onClick={() => handleEdit(category)}>
                    {`Edit ${category.name}`}
                  </button>
                )}
              />
            </div>
            {editingName !== null && (
              <div className="control">
                <button className="button is-light" type="button" onClick={resetForm}>Cancel</button>
              </div>
            )}
          </div>
        </form>
      </div>

      <table className="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Attributes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan={4}>No categories yet.</td>
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
              <td className="has-text-right">
                <button className="button is-small mr-2" type="button" onClick={() => handleEdit(category)}>
                  {isAdmin ? 'Edit' : 'Suggest edit'}
                </button>
                <button className="button is-small is-danger" type="button" onClick={() => handleDelete(category)}>
                  {isAdmin ? 'Delete' : 'Suggest removal'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriesPage
