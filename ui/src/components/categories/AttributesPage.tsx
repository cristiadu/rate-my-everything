import React, { useCallback, useEffect, useState } from 'react'
import { Box, Message, Table } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { Attribute } from '@/components/types'
import { useIsAdmin } from '@/components/users/sessionRoles'

const VALUE_TYPES = ['string', 'number', 'boolean', 'date']

const emptyForm = { name: '', valueType: VALUE_TYPES[0] }

const AttributesPage: React.FC = () => {
  const isAdmin = useIsAdmin()
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [formFields, setFormFields] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadAttributes = useCallback(async () => {
    try {
      const data = await ApiService.get<Attribute[]>(ApiConfig.ENDPOINTS.ATTRIBUTES)
      setAttributes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attributes')
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadAttributes()
    }
  }, [isAdmin, loadAttributes])

  if (!isAdmin) {
    return (
      <Message color="warning">
        <Message.Body>Only admins can manage attributes.</Message.Body>
      </Message>
    )
  }

  // Keep a value type set outside this screen selectable when editing
  const valueTypeOptions = VALUE_TYPES.includes(formFields.valueType)
    ? VALUE_TYPES
    : [...VALUE_TYPES, formFields.valueType]

  const resetForm = () => {
    setFormFields(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      if (editingId === null) {
        await ApiService.post<Attribute>(ApiConfig.ENDPOINTS.ATTRIBUTES, formFields)
      } else {
        await ApiService.put<Attribute>(`${ApiConfig.ENDPOINTS.ATTRIBUTES}/${editingId}`, formFields)
      }
      resetForm()
      await loadAttributes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attribute')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (attribute: Attribute) => {
    setFormFields({ name: attribute.name, valueType: attribute.valueType })
    setEditingId(attribute.id)
  }

  const handleDelete = async (attribute: Attribute) => {
    if (!window.confirm(`Delete attribute "${attribute.name}"? It will be removed from every category that uses it.`)) {
      return
    }

    setError('')
    try {
      await ApiService.delete(`${ApiConfig.ENDPOINTS.ATTRIBUTES}/${attribute.id}`)
      if (editingId === attribute.id) {
        resetForm()
      }
      await loadAttributes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute')
    }
  }

  return (
    <>
      <h2 className="title is-4">Attributes</h2>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}

      <Box>
        <form onSubmit={handleSubmit}>
          <h3 className="title is-5">{editingId === null ? 'New attribute' : 'Edit attribute'}</h3>
          <div className="field">
            <label className="label" htmlFor="attribute-name">Name</label>
            <div className="control">
              <input
                className="input"
                id="attribute-name"
                name="name"
                value={formFields.name}
                onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="attribute-value-type">Value type</label>
            <div className="control">
              <div className="select">
                <select
                  id="attribute-value-type"
                  name="valueType"
                  value={formFields.valueType}
                  onChange={(e) => setFormFields({ ...formFields, valueType: e.target.value })}
                >
                  {valueTypeOptions.map((valueType) => (
                    <option key={valueType} value={valueType}>{valueType}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="buttons">
            <button type="submit" className={`button is-primary${isSaving ? ' is-loading' : ''}`} disabled={isSaving}>
              {editingId === null ? 'Create attribute' : 'Save attribute'}
            </button>
            {editingId !== null && (
              <button type="button" className="button" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </Box>

      <Table striped hoverable size="fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value type</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {attributes.length === 0 ? (
            <tr><td colSpan={3}>No attributes yet.</td></tr>
          ) : attributes.map((attribute) => (
            <tr key={attribute.id}>
              <td>{attribute.name}</td>
              <td>{attribute.valueType}</td>
              <td>
                <div className="buttons is-right">
                  <button type="button" className="button is-small" onClick={() => handleEdit(attribute)}>Edit</button>
                  <button type="button" className="button is-small is-danger" onClick={() => handleDelete(attribute)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}

export default AttributesPage
