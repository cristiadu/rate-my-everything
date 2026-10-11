import React, { useState } from 'react'
import {
  Form, Button,
  Message,
} from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import {
  type AdminUser, MIN_PASSWORD_LENGTH, type StatusMessage, type UserFormValues, UserRole,
} from '@/components/types'

/**
 * Props for the user form. Without onSubmit the form creates the user through the API itself;
 * with onSubmit the parent saves the values (and passes a user to edit it).
 */
interface CreateUserFormProps {
  user?: AdminUser;
  isSaving?: boolean;
  onSubmit?: (values: UserFormValues) => void;
  onCancel?: () => void;
}

/** Form that creates a user, or hands its values to the parent to create or edit one. */
const CreateUserForm: React.FC<CreateUserFormProps> = ({
  user, isSaving: isParentSaving = false, onSubmit, onCancel,
}) => {
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

  /** Hands the values to the parent when it saves them, otherwise creates the user and reports the outcome. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formFields)
      return
    }

    setIsSaving(true)
    setSubmitStatus(null)

    try {
      await ApiService.post<AdminUser>(ApiConfig.ENDPOINTS.USERS, formFields)
      setSubmitStatus({ message: 'User created successfully!', isSuccess: true })
    } catch (err) {
      setSubmitStatus({ message: err instanceof Error ? err.message : 'Failed to create user', isSuccess: false })
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
          <Button renderAs="button" type="submit" color="primary" loading={isSaving || isParentSaving}>
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
