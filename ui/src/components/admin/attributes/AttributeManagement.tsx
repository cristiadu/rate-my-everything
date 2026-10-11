import React, { useCallback, useEffect, useState } from 'react'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import {
  Attribute, AttributeEditorState, AttributeFormValues, StatusMessage,
} from '@/components/types'
import AttributeForm from '@/components/admin/attributes/AttributeForm'

/** Admin screen to list, create, edit and delete the attributes categories can use. */
const AttributeManagement: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editor, setEditor] = useState<AttributeEditorState>(null)
  const [status, setStatus] = useState<StatusMessage>(null)

  /** Fetches the current attribute list from the API. */
  const loadAttributes = useCallback(async () => {
    setIsLoading(true)
    try {
      setAttributes(await ApiService.get<Attribute[]>(ApiConfig.ENDPOINTS.ATTRIBUTES))
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load attributes', isSuccess: false })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttributes()
  }, [loadAttributes])

  /** Creates or updates the attribute in the open form, then reloads the list. */
  const handleSave = async (values: AttributeFormValues) => {
    if (!editor) return
    setIsSaving(true)
    setStatus(null)

    try {
      if (editor.mode === 'create') {
        await ApiService.post<Attribute>(ApiConfig.ENDPOINTS.ATTRIBUTES, values)
        setStatus({ message: `Attribute ${values.name} created.`, isSuccess: true })
      } else {
        await ApiService.put<Attribute>(`${ApiConfig.ENDPOINTS.ATTRIBUTES}/${editor.attribute.id}`, values)
        setStatus({ message: `Attribute ${values.name} updated.`, isSuccess: true })
      }
      setEditor(null)
      await loadAttributes()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to save attribute', isSuccess: false })
    } finally {
      setIsSaving(false)
    }
  }

  /** Deletes the attribute after the admin confirms, then reloads the list. */
  const handleDelete = async (attribute: Attribute) => {
    if (!window.confirm(`Delete attribute ${attribute.name}? It will be removed from every category that uses it.`)) return
    setStatus(null)

    try {
      await ApiService.delete<void>(`${ApiConfig.ENDPOINTS.ATTRIBUTES}/${attribute.id}`)
      setStatus({ message: `Attribute ${attribute.name} deleted.`, isSuccess: true })
      await loadAttributes()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to delete attribute', isSuccess: false })
    }
  }

  return (
    <div className="box">
      <div className="level">
        <div className="level-left">
          <h2 className="title is-4">Attributes</h2>
        </div>
        <div className="level-right">
          <button className="button is-primary" type="button" onClick={() => setEditor({ mode: 'create' })} disabled={!!editor}>
            New attribute
          </button>
        </div>
      </div>

      {status && (
        <div className={`notification ${status.isSuccess ? 'is-success' : 'is-danger'}`} role="status">
          {status.message}
        </div>
      )}

      {editor && (
        <div className="box">
          <h3 className="title is-5">
            {editor.mode === 'create' ? 'New attribute' : `Edit ${editor.attribute.name}`}
          </h3>
          <AttributeForm
            key={editor.mode === 'edit' ? editor.attribute.id : 'new'}
            attribute={editor.mode === 'edit' ? editor.attribute : undefined}
            isSaving={isSaving}
            onSubmit={handleSave}
            onCancel={() => setEditor(null)}
          />
        </div>
      )}

      {isLoading ? (
        <p>Loading attributes...</p>
      ) : (
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value type</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {attributes.length === 0 && (
              <tr>
                <td colSpan={3}>No attributes yet.</td>
              </tr>
            )}
            {attributes.map((attribute) => (
              <tr key={attribute.id}>
                <td>{attribute.name}</td>
                <td><span className="tag is-info">{attribute.valueType}</span></td>
                <td className="has-text-right">
                  <button className="button is-small mr-2" type="button" onClick={() => setEditor({ mode: 'edit', attribute })}>
                    Edit
                  </button>
                  <button className="button is-small is-danger" type="button" onClick={() => handleDelete(attribute)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AttributeManagement
