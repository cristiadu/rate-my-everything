import React, { useCallback, useEffect, useState } from 'react'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type {
  AdminUser, StatusMessage, UserEditorState, UserFormValues,
} from '@/components/types'
import UserForm from '@/components/admin/users/UserForm'

/** Admin screen to list, create, edit and delete users. */
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editor, setEditor] = useState<UserEditorState>(null)
  const [status, setStatus] = useState<StatusMessage>(null)

  /** Fetches the current user list from the API. */
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      setUsers(await ApiService.get<AdminUser[]>(ApiConfig.ENDPOINTS.USERS))
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to load users', isSuccess: false })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  /** Creates or updates the user in the open form, then reloads the list. */
  const handleSave = async (values: UserFormValues) => {
    if (!editor) return
    setIsSaving(true)
    setStatus(null)

    // Only send a password when one was typed, so editing keeps the current one
    const { password, ...rest } = values
    const body: Partial<UserFormValues> = password ? values : rest

    try {
      if (editor.mode === 'create') {
        await ApiService.post<AdminUser>(ApiConfig.ENDPOINTS.USERS, body)
        setStatus({ message: `User ${values.username} created.`, isSuccess: true })
      } else {
        await ApiService.put<AdminUser>(`${ApiConfig.ENDPOINTS.USERS}/${editor.user.id}`, body)
        setStatus({ message: `User ${values.username} updated.`, isSuccess: true })
      }
      setEditor(null)
      await loadUsers()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to save user', isSuccess: false })
    } finally {
      setIsSaving(false)
    }
  }

  /** Deletes the user after the admin confirms, then reloads the list. */
  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete user ${user.username}? This cannot be undone.`)) return
    setStatus(null)

    try {
      await ApiService.delete<void>(`${ApiConfig.ENDPOINTS.USERS}/${user.id}`)
      setStatus({ message: `User ${user.username} deleted.`, isSuccess: true })
      await loadUsers()
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Failed to delete user', isSuccess: false })
    }
  }

  return (
    <div className="box">
      <div className="level">
        <div className="level-left">
          <h2 className="title is-4">Users</h2>
        </div>
        <div className="level-right">
          <button className="button is-primary" type="button" onClick={() => setEditor({ mode: 'create' })} disabled={!!editor}>
            New user
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
            {editor.mode === 'create' ? 'New user' : `Edit ${editor.user.username}`}
          </h3>
          <UserForm
            key={editor.mode === 'edit' ? editor.user.id : 'new'}
            user={editor.mode === 'edit' ? editor.user : undefined}
            isSaving={isSaving}
            onSubmit={handleSave}
            onCancel={() => setEditor(null)}
          />
        </div>
      )}

      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Roles</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4}>No users yet.</td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <div className="tags">
                    {user.roles.map((role) => <span key={role} className="tag is-info">{role}</span>)}
                  </div>
                </td>
                <td className="has-text-right">
                  <button className="button is-small mr-2" type="button" onClick={() => setEditor({ mode: 'edit', user })}>
                    Edit
                  </button>
                  <button className="button is-small is-danger" type="button" onClick={() => handleDelete(user)}>
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

export default UserManagement
