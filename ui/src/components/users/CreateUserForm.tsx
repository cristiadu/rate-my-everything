import React, { useState } from 'react'
import {
  Form, Button,
  Message,
} from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import {
  AdminUser, MIN_PASSWORD_LENGTH, StatusMessage, UserFormValues, UserRole,
} from '@/components/types'

/** Props for the user form; pass a user to edit it, or none to create one. */
interface CreateUserFormProps {
  user?: AdminUser;
  onSaved?: (user: AdminUser) => void;
  onCancel?: () => void;
}

/** Form that creates a user, or edits one when a user is passed in. */
const CreateUserForm: React.FC<CreateUserFormProps> = ({ user, onSaved, onCancel }) => {
  const isEditing = !!user
  const [formFields, setFormFields] = useState<UserFormValues>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    roles: user?.roles ?? [UserRole.USER],
  })
  const [submitStatus, setSubmitStatus] = useState<StatusMessage>(null)
  const [isSaving, setIsSaving] = useState(false)

  /** Copies a text input's value into the form state by its name. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields,
      [e.target.name]: e.target.value,
    })
  }

  /** Adds the role if it is missing, or removes it if present. */
  const handleRoleChange = (role: UserRole) => {
    setFormFields({
      ...formFields,
      roles: formFields.roles.includes(role)
        ? formFields.roles.filter((current) => current !== role)
        : [...formFields.roles, role],
    })
  }

  /** Creates or updates the user, then reports the outcome. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSubmitStatus(null)

    // Only send a password when one was typed, so editing keeps the current one
    const { password, ...rest } = formFields
    const body: Partial<UserFormValues> = password ? formFields : rest

    try {
      const savedUser = isEditing
        ? await ApiService.put<AdminUser>(`${ApiConfig.ENDPOINTS.USERS}/${user.id}`, body)
        : await ApiService.post<AdminUser>(ApiConfig.ENDPOINTS.USERS, body)
      setSubmitStatus({
        message: isEditing ? 'User updated successfully!' : 'User created successfully!',
        isSuccess: true,
      })
      onSaved?.(savedUser)
    } catch (err) {
      setSubmitStatus({
        message: err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} user`,
        isSuccess: false,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit user' : 'Create user'}>
      {submitStatus && (
        <Message color={submitStatus.isSuccess ? 'success' : 'danger'}>
          <Message.Body>
            {submitStatus.message}
          </Message.Body>
        </Message>
      )}
      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-username">Username</Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-username"
            type="text"
            placeholder="Enter the username"
            value={formFields.username}
            onChange={handleInputChange}
            required
            name="username"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-email">Email</Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-email"
            type="email"
            placeholder="Enter the email"
            value={formFields.email}
            onChange={handleInputChange}
            required
            name="email"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-password">
          {isEditing ? 'New password (leave blank to keep the current one)' : 'Password'}
        </Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-password"
            type="password"
            placeholder="Enter the password"
            value={formFields.password}
            onChange={handleInputChange}
            required={!isEditing}
            minLength={MIN_PASSWORD_LENGTH}
            name="password"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label">Roles</Form.Label>
        <Form.Control>
          {Object.values(UserRole).map((role) => (
            <Form.Checkbox
              key={role}
              renderAs="input"
              className="mr-4"
              checked={formFields.roles.includes(role)}
              onChange={() => handleRoleChange(role)}
            >
              {role}
            </Form.Checkbox>
          ))}
        </Form.Control>
      </Form.Field>

      <Form.Field kind="group">
        <Form.Control>
          <Button renderAs="button" type="submit" color="primary" loading={isSaving}>
            {isEditing ? 'Save changes' : 'Create User'}
          </Button>
        </Form.Control>
        {onCancel && (
          <Form.Control>
            <Button renderAs="button" type="button" color="light" onClick={onCancel}>
              Cancel
            </Button>
          </Form.Control>
        )}
      </Form.Field>
    </form>
  )
}

export default CreateUserForm
